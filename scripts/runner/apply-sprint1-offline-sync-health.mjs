import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());

function filePath(relativePath) {
  return path.join(root, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(filePath(relativePath), "utf8");
}

function write(relativePath, content) {
  const target = filePath(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}

function replaceOnce(relativePath, before, after) {
  const source = read(relativePath);
  if (!source.includes(before)) {
    throw new Error("Missing expected offline-sync contract in " + relativePath + ": " + before.slice(0, 180));
  }
  write(relativePath, source.replace(before, after));
}

function appendOnce(relativePath, marker, addition) {
  const source = read(relativePath);
  if (source.includes(marker)) return;
  write(relativePath, source.trimEnd() + "\n\n" + addition.trim() + "\n");
}

write("apps/web/lib/offline-sync.ts", `export type OfflineSyncStatus = "pending" | "syncing" | "conflict" | "failed";

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
`);

write("apps/web/components/system/OfflineSyncHealth.tsx", `"use client";

import { useCallback, useEffect, useState } from "react";
import { updateDoctorVisit } from "@/lib/doctor-visit";
import { flushOfflineSync, getOfflineSyncSummary, subscribeOfflineSync, type OfflineSyncSummary } from "@/lib/offline-sync";

const emptySummary: OfflineSyncSummary = { total: 0, pending: 0, syncing: 0, failed: 0, conflicts: 0 };

export function OfflineSyncHealth() {
  const [online, setOnline] = useState(true);
  const [summary, setSummary] = useState<OfflineSyncSummary>(emptySummary);
  const [retrying, setRetrying] = useState(false);

  const refresh = useCallback(() => {
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    setSummary(getOfflineSyncSummary());
  }, []);

  const retry = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      refresh();
      return;
    }
    setRetrying(true);
    try {
      await flushOfflineSync((item) => updateDoctorVisit(item.patientId, item.encounterId, item.payload, item.expectedUpdatedAt));
    } finally {
      setRetrying(false);
      refresh();
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeOfflineSync(refresh);
    const onOnline = () => { refresh(); void retry(); };
    const onOffline = () => refresh();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      unsubscribe();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh, retry]);

  const state = !online ? "offline" : summary.conflicts ? "conflict" : summary.failed ? "failed" : summary.total ? "pending" : "synced";
  const label = !online ? "Offline" : summary.conflicts ? "Sync conflict" : summary.failed ? "Sync failed" : summary.total ? "Pending sync" : "Synced";

  return (
    <details className={"offline-sync-health " + state} data-offline-sync-health>
      <summary aria-label={label + ". " + summary.total + " queued item(s)."}>
        <span className="offline-sync-dot" aria-hidden="true" />
        <span>{label}</span>
        {summary.total ? <span className="badge">{summary.total}</span> : null}
      </summary>
      <div className="offline-sync-popover" role="status" aria-live="polite">
        <strong>Autosave health</strong>
        <p>{online ? "Clinic connection available." : "No connection. Work remains saved on this device."}</p>
        <div className="offline-sync-counts">
          <span>Pending {summary.pending + summary.syncing}</span>
          <span>Failed {summary.failed}</span>
          <span>Conflicts {summary.conflicts}</span>
        </div>
        {summary.conflicts ? <p className="form-error">A newer server copy exists. Open that visit and choose which copy to keep. Nothing is overwritten automatically.</p> : null}
        <button className="button secondary compact" type="button" disabled={!online || retrying || summary.total === 0 || summary.total === summary.conflicts} onClick={() => void retry()}>{retrying ? "Retrying..." : "Retry pending sync"}</button>
      </div>
    </details>
  );
}
`);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'import { completeDoctorVisit, createDoctorVisitFollowUp, getDoctorVisitPacket, getCurrentDoctorVisit, startDoctorVisit, updateDoctorVisit, type DoctorVisitState } from "@/lib/doctor-visit";\n',
  'import { completeDoctorVisit, createDoctorVisitFollowUp, getDoctorVisitPacket, getCurrentDoctorVisit, startDoctorVisit, updateDoctorVisit, type DoctorVisitState } from "@/lib/doctor-visit";\nimport { clearOfflineVisitDraft, enqueueOfflineVisitDraft, getOfflineVisitDraft, retryOfflineVisitDraft, subscribeOfflineSync, syncOfflineVisitDraft, type OfflineSyncOutcome } from "@/lib/offline-sync";\n'
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '  const [saveState, setSaveState] = useState<"synced" | "unsaved" | "local" | "syncing" | "failed" | "offline">("synced");',
  '  const [saveState, setSaveState] = useState<"synced" | "unsaved" | "local" | "queued" | "syncing" | "failed" | "offline" | "conflict">("synced");'
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '      const recovered = String(data.encounter?.status ?? "") === "draft" ? readLocalVisitDraft(draftKey) : null;\n      setEncounterForm(recovered ? { ...serverForm, ...recovered } : serverForm);\n      setSaveState(recovered ? "local" : "synced");',
  '      const queuedDraft = String(data.encounter?.status ?? "") === "draft" ? getOfflineVisitDraft(patientId, visitId) : null;\n      const recovered = queuedDraft?.payload ?? (String(data.encounter?.status ?? "") === "draft" ? readLocalVisitDraft(draftKey) : null);\n      setEncounterForm(recovered ? { ...serverForm, ...recovered } : serverForm);\n      setSaveState(queuedDraft?.status === "conflict" ? "conflict" : queuedDraft ? (navigator.onLine ? "queued" : "offline") : recovered ? "local" : "synced");'
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  `  useEffect(() => {
    if (!contextReady || saveState !== "unsaved") return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(encounterForm));
        setSaveState(navigator.onLine ? "local" : "offline");
      } catch {
        setSaveState("failed");
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [contextReady, draftKey, encounterForm, saveState]);`,
  `  const syncEncounterDraft = useCallback(async (source: "auto" | "manual" = "manual"): Promise<OfflineSyncOutcome> => {
    if (!contextReady || signedVisit) return "failed";
    try {
      localStorage.setItem(draftKey, JSON.stringify(encounterForm));
      enqueueOfflineVisitDraft({ patientId, encounterId: visitId, payload: encounterForm, expectedUpdatedAt: String(encounter?.updatedAt ?? "") });
    } catch {
      setSaveState("failed");
      setStatus("Local autosave failed. Keep this page open and retry.");
      return "failed";
    }
    if (!navigator.onLine) {
      setSaveState("offline");
      setStatus("Saved on this device. It will sync when the connection returns.");
      return "offline";
    }
    setSaveState("syncing");
    const outcome = await syncOfflineVisitDraft(patientId, visitId, (item) => updateDoctorVisit(item.patientId, item.encounterId, item.payload, item.expectedUpdatedAt));
    if (outcome === "synced") {
      localStorage.removeItem(draftKey);
      setSaveState("synced");
      setStatus(source === "auto" ? "Autosaved and synced." : "Draft synced.");
      await loadVisit();
      window.dispatchEvent(new CustomEvent("patient-workspace:refresh"));
      return outcome;
    }
    setSaveState(outcome === "queued" ? "queued" : outcome);
    setStatus(outcome === "conflict"
      ? "A newer server copy exists. Reload the server version or keep this local copy for review. Nothing was overwritten."
      : outcome === "offline"
        ? "Saved on this device. It will sync when the connection returns."
        : "Saved locally, but server sync failed. Retry when the clinic connection is stable.");
    return outcome;
  }, [contextReady, draftKey, encounter?.updatedAt, encounterForm, loadVisit, patientId, signedVisit, visitId]);

  useEffect(() => {
    if (!contextReady || saveState !== "unsaved") return;
    const timer = window.setTimeout(() => { void syncEncounterDraft("auto"); }, 500);
    return () => window.clearTimeout(timer);
  }, [contextReady, saveState, syncEncounterDraft]);

  useEffect(() => {
    const retryOnReconnect = () => {
      const queued = getOfflineVisitDraft(patientId, visitId);
      if (queued && queued.status !== "conflict") {
        retryOfflineVisitDraft(patientId, visitId);
        void syncEncounterDraft("auto");
      }
    };
    window.addEventListener("online", retryOnReconnect);
    return () => window.removeEventListener("online", retryOnReconnect);
  }, [patientId, syncEncounterDraft, visitId]);

  useEffect(() => subscribeOfflineSync(() => {
    const queued = getOfflineVisitDraft(patientId, visitId);
    if (queued?.status === "conflict") setSaveState("conflict");
    else if (queued?.status === "failed") setSaveState("failed");
    else if (queued?.status === "syncing") setSaveState("syncing");
    else if (queued?.status === "pending") setSaveState(navigator.onLine ? "queued" : "offline");
  }), [patientId, visitId]);`
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  `  async function saveEncounter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contextReady) return;
    setSaveState("syncing");
    try {
      await updateDoctorVisit(patientId, visitId, encounterForm, String(encounter?.updatedAt ?? ""));
      localStorage.removeItem(draftKey);
      setSaveState("synced");
      setStatus("Draft synced.");
      await loadVisit();
      window.dispatchEvent(new CustomEvent("patient-workspace:refresh"));
    } catch (saveError) {
      setSaveState(navigator.onLine ? "failed" : "offline");
      setStatus(saveError instanceof Error ? saveError.message : "Draft save failed.");
    }
  }`,
  `  async function saveEncounter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contextReady) return;
    await syncEncounterDraft("manual");
  }`
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  `  async function finishVisit(printAfter = false) {
    if (!contextReady || finishing || signedVisit) return;
    setFinishing(true);
    try {
      if (saveState !== "synced") {
        await updateDoctorVisit(patientId, visitId, encounterForm, String(encounter?.updatedAt ?? ""));
      }
      await completeDoctorVisit(patientId, visitId);`,
  `  async function finishVisit(printAfter = false) {
    if (!contextReady || finishing || signedVisit) return;
    if (saveState !== "synced") {
      setStatus("Sync all local changes before signing this visit.");
      return;
    }
    setFinishing(true);
    try {
      await completeDoctorVisit(patientId, visitId);`
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  `  function requestFinish(printAfter = false) {
    if (!contextReady || signedVisit || finishing) return;
    setFinishIntent(printAfter ? "print" : "finish");
  }`,
  `  function requestFinish(printAfter = false) {
    if (!contextReady || signedVisit || finishing) return;
    if (saveState !== "synced") {
      setStatus("Sync all local changes before signing this visit.");
      return;
    }
    setFinishIntent(printAfter ? "print" : "finish");
  }

  async function retryCurrentVisitSync() {
    retryOfflineVisitDraft(patientId, visitId);
    await syncEncounterDraft("manual");
  }

  async function discardLocalVisitCopy() {
    clearOfflineVisitDraft(patientId, visitId);
    localStorage.removeItem(draftKey);
    setSaveState("synced");
    setStatus("Local copy discarded. Server version reloaded.");
    await loadVisit();
  }`
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<button className="button compact" disabled={finishing || signedVisit || !contextReady} type="button" onClick={() => requestFinish(false)}>Finish visit</button>',
  '<button className="button compact" disabled={finishing || signedVisit || !contextReady || saveState !== "synced"} type="button" onClick={() => requestFinish(false)}>Finish visit</button>'
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<button className="button secondary compact" disabled={finishing || signedVisit || !contextReady} type="button" onClick={() => requestFinish(true)}>Finish and print</button>',
  '<button className="button secondary compact" disabled={finishing || signedVisit || !contextReady || saveState !== "synced"} type="button" onClick={() => requestFinish(true)}>Finish and print</button>'
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  `          </div>

          {finishIntent && (`,
  `          </div>
          {["offline", "queued", "failed", "conflict"].includes(saveState) ? (
            <section className={"visit-sync-recovery no-print " + saveState} aria-live="polite" data-visit-sync-recovery>
              <div><strong>{saveState === "conflict" ? "Sync conflict" : saveState === "offline" ? "Working offline" : "Draft waiting to sync"}</strong><p>{saveState === "conflict" ? "A newer server copy exists. This device copy is preserved and will not overwrite it automatically." : "Your draft is saved on this device and remains locked to this patient and visit."}</p></div>
              <div className="form-actions"><button className="button secondary compact" type="button" disabled={!navigator.onLine || saveState === "conflict"} onClick={() => void retryCurrentVisitSync()}>Retry sync</button>{saveState === "conflict" ? <button className="button secondary compact danger" type="button" onClick={() => void discardLocalVisitCopy()}>Discard local and reload server</button> : null}</div>
            </section>
          ) : null}

          {finishIntent && (`
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<button className="button" type="button" disabled={finishing || !contextReady || signedVisit} onClick={() => { const printAfter = finishIntent === "print"; setFinishIntent(null); void finishVisit(printAfter); }}>',
  '<button className="button" type="button" disabled={finishing || !contextReady || signedVisit || saveState !== "synced"} onClick={() => { const printAfter = finishIntent === "print"; setFinishIntent(null); void finishVisit(printAfter); }}>'
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<div className="form-actions no-print"><button className="button secondary" type="button" onClick={onRefresh}>Refresh packet</button><button className="button" disabled={finishing || signedVisit || requiredMissing.length > 0} type="button" onClick={() => onRequestFinish(false)}>Finish visit</button><button className="button secondary" disabled={finishing || signedVisit || requiredMissing.length > 0} type="button" onClick={() => onRequestFinish(true)}>Finish and print</button></div>',
  '<div className="form-actions no-print"><button className="button secondary" type="button" onClick={onRefresh}>Refresh packet</button><button className="button" disabled={finishing || signedVisit || requiredMissing.length > 0 || saveState !== "synced"} type="button" onClick={() => onRequestFinish(false)}>Finish visit</button><button className="button secondary" disabled={finishing || signedVisit || requiredMissing.length > 0 || saveState !== "synced"} type="button" onClick={() => onRequestFinish(true)}>Finish and print</button></div>'
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  `function saveStateLabel(state: string) {
  if (state === "syncing") return "Syncing";
  if (state === "synced") return "Synced";
  if (state === "offline") return "Offline";
  if (state === "failed") return "Save failed â€” Retry";
  if (state === "local") return \`Saved locally at \${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\`;
  return "Unsaved changes";
}`,
  `function saveStateLabel(state: string) {
  if (state === "syncing") return "Syncing";
  if (state === "synced") return "Synced";
  if (state === "offline") return "Offline · saved locally";
  if (state === "queued") return "Pending sync";
  if (state === "conflict") return "Sync conflict · review required";
  if (state === "failed") return "Save failed — Retry";
  if (state === "local") return \`Saved locally at \${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\`;
  return "Unsaved changes";
}`
);

replaceOnce(
  "apps/web/app/mvp-page.tsx",
  'import { canAccessWorkspace, roleLandingPath } from "@/lib/role-routing";\n',
  'import { canAccessWorkspace, roleLandingPath } from "@/lib/role-routing";\nimport { OfflineSyncHealth } from "@/components/system/OfflineSyncHealth";\n'
);

replaceOnce(
  "apps/web/app/mvp-page.tsx",
  '<div className="receptionist-topbar-actions" aria-label="Reception account actions">\n              <Link',
  '<div className="receptionist-topbar-actions" aria-label="Reception account actions">\n              <OfflineSyncHealth />\n              <Link'
);

replaceOnce(
  "apps/web/app/mvp-page.tsx",
  '          ) : <UserMenu user={user} canOpenAdmin={canOpenAdmin} onLogout={signOut} />}\n',
  '          ) : <div className="topbar-account-actions"><OfflineSyncHealth /><UserMenu user={user} canOpenAdmin={canOpenAdmin} onLogout={signOut} /></div>}\n'
);

appendOnce("apps/web/app/globals.css", "/* Sprint 1 offline sync health */", `/* Sprint 1 offline sync health */
.offline-sync-health { position: relative; }
.offline-sync-health > summary { align-items: center; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; cursor: pointer; display: inline-flex; font-size: .8rem; gap: .4rem; min-height: 36px; padding: .35rem .65rem; white-space: nowrap; }
.offline-sync-health > summary::-webkit-details-marker { display: none; }
.offline-sync-dot { background: #23956f; border-radius: 50%; box-shadow: 0 0 0 3px color-mix(in srgb, #23956f 18%, transparent); height: 8px; width: 8px; }
.offline-sync-health.offline .offline-sync-dot, .offline-sync-health.pending .offline-sync-dot { background: #c98b20; box-shadow: 0 0 0 3px color-mix(in srgb, #c98b20 18%, transparent); }
.offline-sync-health.failed .offline-sync-dot, .offline-sync-health.conflict .offline-sync-dot { background: #b84b4b; box-shadow: 0 0 0 3px color-mix(in srgb, #b84b4b 18%, transparent); }
.offline-sync-popover { background: var(--surface); border: 1px solid var(--border); border-radius: .75rem; box-shadow: var(--shadow-lg); display: grid; gap: .55rem; inset-inline-end: 0; margin-top: .4rem; min-width: min(330px, calc(100vw - 2rem)); padding: .8rem; position: absolute; z-index: 80; }
.offline-sync-popover p { margin: 0; }
.offline-sync-counts { display: grid; gap: .35rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.offline-sync-counts span { background: var(--surface-muted); border-radius: .45rem; font-size: .75rem; padding: .4rem; text-align: center; }
.topbar-account-actions { align-items: center; display: flex; gap: .5rem; }
.visit-sync-recovery { align-items: center; background: var(--surface); border: 1px solid var(--border); border-inline-start: 4px solid #c98b20; border-radius: .7rem; display: flex; gap: .75rem; justify-content: space-between; margin: .65rem 0; padding: .7rem .85rem; }
.visit-sync-recovery.conflict { border-inline-start-color: #b84b4b; }
.visit-sync-recovery p { margin: .2rem 0 0; }
.visit-save-state.queued, .visit-save-state.offline { background: color-mix(in srgb, #c98b20 15%, var(--surface)); }
.visit-save-state.conflict, .visit-save-state.failed { background: color-mix(in srgb, #b84b4b 15%, var(--surface)); }
@media (max-width: 720px) {
  .offline-sync-health > summary > span:not(.offline-sync-dot):not(.badge) { display: none; }
  .visit-sync-recovery { align-items: stretch; flex-direction: column; }
  .visit-sync-recovery .form-actions { width: 100%; }
  .visit-sync-recovery .button { flex: 1; }
}`);

write("scripts/sprint1-offline-sync-health-test.mjs", `import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const offline = read("apps/web/lib/offline-sync.ts");
const health = read("apps/web/components/system/OfflineSyncHealth.tsx");
const visit = read("apps/web/components/clinic/ActiveVisitWorkspace.tsx");
const shell = read("apps/web/app/mvp-page.tsx");
const css = read("apps/web/app/globals.css");

const requireAll = (source, label, needles) => {
  for (const needle of needles) if (!source.includes(needle)) throw new Error(label + " missing: " + needle);
};

requireAll(offline, "offline queue", [
  "prij:offline-sync:v1",
  "doctor-visit-draft",
  "expectedUpdatedAt",
  "VISIT_DRAFT_STALE",
  "ENCOUNTER_SIGN_CONFLICT",
  "Nothing",
  "sanitizeValue",
  "forbiddenPayloadKeys",
  "activeSyncIds",
  "status === \"conflict\"",
  "navigator.onLine",
  "flushOfflineSync"
]);
if (/sessionStorage|getItem\(["']prijClinicToken|authorization:/i.test(offline)) throw new Error("Offline queue must not persist authentication material.");
requireAll(health, "global sync health", ["Autosave health", "Pending", "Conflicts", "Retry pending sync", "Nothing is overwritten automatically", "data-offline-sync-health"]);
requireAll(visit, "visit autosave", [
  "enqueueOfflineVisitDraft",
  "syncOfflineVisitDraft",
  "subscribeOfflineSync",
  "Saved on this device",
  "Sync all local changes before signing this visit",
  "Discard local and reload server",
  "data-visit-sync-recovery",
  "saveState !== \"synced\""
]);
requireAll(shell, "shell indicator", ["OfflineSyncHealth", "topbar-account-actions", "receptionist-topbar-actions"]);
requireAll(css, "responsive sync UI", ["Sprint 1 offline sync health", ".offline-sync-popover", ".visit-sync-recovery", "@media (max-width: 720px)"]);
console.log("Sprint 1 offline autosave, sync queue, conflict recovery, and health indicator PASS");
`);

console.log("Sprint 1 offline sync health package applied.");
