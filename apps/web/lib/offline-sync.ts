export type OfflineSyncStatus = "pending" | "syncing" | "conflict" | "failed";

export type OfflineVisitDraft = {
  id: string;
  kind: "doctor-visit-draft";
  patientId: string;
  encounterId: string;
  payload: Record<string, unknown>;
  expectedUpdatedAt: string;
  status: OfflineSyncStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
};

export type OfflineSyncSummary = {
  total: number;
  pending: number;
  syncing: number;
  failed: number;
  conflicts: number;
};

export type OfflineSyncOutcome = "synced" | "offline" | "queued" | "conflict" | "failed";

const STORAGE_KEY = "prij:offline-sync:v1";
const CHANGE_EVENT = "prij:offline-sync:changed";
const activeSyncIds = new Set<string>();
const forbiddenPayloadKeys = /^(authorization|token|accessToken|refreshToken|cookie|password|secret|session)$/i;

function browserReady() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function visitId(patientId: string, encounterId: string) {
  return ["visit", patientId, encounterId].join(":");
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !forbiddenPayloadKeys.test(key))
    .map(([key, item]) => [key, sanitizeValue(item)]));
}

function readQueue(): OfflineVisitDraft[] {
  if (!browserReady()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is OfflineVisitDraft => Boolean(
      item && typeof item === "object" &&
      (item as OfflineVisitDraft).kind === "doctor-visit-draft" &&
      typeof (item as OfflineVisitDraft).patientId === "string" &&
      typeof (item as OfflineVisitDraft).encounterId === "string" &&
      typeof (item as OfflineVisitDraft).payload === "object"
    ));
  } catch {
    return [];
  }
}

function writeQueue(items: OfflineVisitDraft[]) {
  if (!browserReady()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function updateItem(id: string, patch: Partial<OfflineVisitDraft>) {
  writeQueue(readQueue().map((item) => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item));
}

export function listOfflineSyncItems() {
  return readQueue();
}

export function getOfflineVisitDraft(patientId: string, encounterId: string) {
  return readQueue().find((item) => item.id === visitId(patientId, encounterId)) ?? null;
}

export function enqueueOfflineVisitDraft(input: {
  patientId: string;
  encounterId: string;
  payload: Record<string, unknown>;
  expectedUpdatedAt: string;
}) {
  const id = visitId(input.patientId, input.encounterId);
  const now = new Date().toISOString();
  const current = readQueue();
  const existing = current.find((item) => item.id === id);
  const next: OfflineVisitDraft = {
    id,
    kind: "doctor-visit-draft",
    patientId: input.patientId,
    encounterId: input.encounterId,
    payload: sanitizeValue(input.payload) as Record<string, unknown>,
    expectedUpdatedAt: existing?.expectedUpdatedAt || input.expectedUpdatedAt,
    status: existing?.status === "conflict" ? "conflict" : "pending",
    attempts: existing?.attempts ?? 0,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ...(existing?.status === "conflict" ? { lastErrorCode: existing.lastErrorCode, lastErrorMessage: existing.lastErrorMessage } : {})
  };
  writeQueue([...current.filter((item) => item.id !== id), next]);
  return next;
}

export function clearOfflineVisitDraft(patientId: string, encounterId: string) {
  const id = visitId(patientId, encounterId);
  writeQueue(readQueue().filter((item) => item.id !== id));
}

export function retryOfflineVisitDraft(patientId: string, encounterId: string) {
  const item = getOfflineVisitDraft(patientId, encounterId);
  if (!item || item.status === "conflict") return;
  updateItem(item.id, { status: "pending", lastErrorCode: undefined, lastErrorMessage: undefined });
}

export function getOfflineSyncSummary(): OfflineSyncSummary {
  const items = readQueue();
  return {
    total: items.length,
    pending: items.filter((item) => item.status === "pending").length,
    syncing: items.filter((item) => item.status === "syncing").length,
    failed: items.filter((item) => item.status === "failed").length,
    conflicts: items.filter((item) => item.status === "conflict").length
  };
}

export function subscribeOfflineSync(listener: () => void) {
  if (!browserReady()) return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

function errorDetail(error: unknown) {
  const row = error as { code?: unknown; status?: unknown; message?: unknown };
  const code = String(row?.code ?? "");
  const status = Number(row?.status ?? 0);
  const message = error instanceof Error ? error.message : String(row?.message ?? "Sync failed.");
  const conflict = status === 409 || code === "VISIT_DRAFT_STALE" || code === "ENCOUNTER_SIGN_CONFLICT";
  return { code, message, conflict };
}

export async function syncOfflineVisitDraft(
  patientId: string,
  encounterId: string,
  send: (item: OfflineVisitDraft) => Promise<unknown>
): Promise<OfflineSyncOutcome> {
  const item = getOfflineVisitDraft(patientId, encounterId);
  if (!item) return "synced";
  if (item.status === "conflict") return "conflict";
  if (!browserReady() || !navigator.onLine) return "offline";
  if (activeSyncIds.has(item.id)) return "queued";
  activeSyncIds.add(item.id);
  updateItem(item.id, { status: "syncing" });
  try {
    await send(item);
    clearOfflineVisitDraft(item.patientId, item.encounterId);
    return "synced";
  } catch (error) {
    const detail = errorDetail(error);
    updateItem(item.id, {
      status: detail.conflict ? "conflict" : "failed",
      attempts: item.attempts + 1,
      lastErrorCode: detail.code || undefined,
      lastErrorMessage: detail.message
    });
    return detail.conflict ? "conflict" : "failed";
  } finally {
    activeSyncIds.delete(item.id);
  }
}

export async function flushOfflineSync(send: (item: OfflineVisitDraft) => Promise<unknown>) {
  if (!browserReady() || !navigator.onLine) return getOfflineSyncSummary();
  for (const item of readQueue()) {
    if (item.status === "conflict" || item.status === "syncing") continue;
    await syncOfflineVisitDraft(item.patientId, item.encounterId, send);
  }
  return getOfflineSyncSummary();
}

export const offlineSyncStorageKey = STORAGE_KEY;
