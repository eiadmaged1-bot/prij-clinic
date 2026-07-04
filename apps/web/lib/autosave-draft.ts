import { useEffect, useMemo, useState } from "react";

export type AutosaveState = "idle" | "saving" | "saved-local" | "offline-local" | "failed";

const dbName = "prij-clinic-local-drafts";
const storeName = "drafts";
const queueStoreName = "syncQueue";

export type LocalDraftRecord<T> = {
  key: string;
  entityType: string;
  patientId?: string | null;
  payload: T;
  updatedAt: string;
};

export type OfflineQueueOperation<T = unknown> = {
  operationId: string;
  idempotencyKey: string;
  entityType: string;
  patientId?: string | null;
  payload: T;
  endpoint: string;
  method: "POST" | "PATCH";
  createdAt: string;
  lastAttemptAt?: string | null;
  retryCount: number;
  status: "pending" | "failed" | "synced";
};

export function useAutosaveDraft<T extends Record<string, unknown>>(input: {
  key: string;
  entityType: string;
  patientId?: string | null;
  payload: T;
  enabled?: boolean;
  debounceMs?: number;
}) {
  const [state, setState] = useState<AutosaveState>("idle");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const enabled = input.enabled !== false;
  const serialized = useMemo(() => JSON.stringify(input.payload), [input.payload]);

  useEffect(() => {
    if (!enabled) return;
    const timeout = window.setTimeout(() => {
      setState("saving");
      void saveLocalDraft({
        key: input.key,
        entityType: input.entityType,
        patientId: input.patientId,
        payload: input.payload,
        updatedAt: new Date().toISOString()
      })
        .then((record) => {
          setUpdatedAt(record.updatedAt);
          setState(navigator.onLine ? "saved-local" : "offline-local");
        })
        .catch(() => setState("failed"));
    }, input.debounceMs ?? 450);
    return () => window.clearTimeout(timeout);
  }, [enabled, input.debounceMs, input.entityType, input.key, input.patientId, input.payload, serialized]);

  useEffect(() => {
    if (!enabled) return;
    const persistBeforeUnload = () => {
      try {
        localStorage.setItem(fallbackKey(input.key), JSON.stringify({
          key: input.key,
          entityType: input.entityType,
          patientId: input.patientId,
          payload: input.payload,
          updatedAt: new Date().toISOString()
        }));
      } catch {
        // Best-effort unload fallback.
      }
    };
    window.addEventListener("beforeunload", persistBeforeUnload);
    return () => window.removeEventListener("beforeunload", persistBeforeUnload);
  }, [enabled, input.entityType, input.key, input.patientId, input.payload, serialized]);

  return { state, updatedAt };
}

export function useOfflineSyncQueue(apiBaseUrl: string, token?: string | null) {
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const pending = await listOfflineOperations();
      if (!cancelled) setPendingCount(pending.filter((operation) => operation.status === "pending" || operation.status === "failed").length);
    }
    async function syncNow() {
      setIsSyncing(true);
      const result = await syncPendingOperations(apiBaseUrl, token);
      if (!cancelled) {
        setPendingCount(result.pendingCount);
        if (result.syncedCount) setLastSyncedAt(new Date().toISOString());
        setIsSyncing(false);
      }
    }
    void refresh();
    if (navigator.onLine) void syncNow();
    window.addEventListener("online", syncNow);
    return () => {
      cancelled = true;
      window.removeEventListener("online", syncNow);
    };
  }, [apiBaseUrl, token]);

  async function syncNow() {
    setIsSyncing(true);
    const result = await syncPendingOperations(apiBaseUrl, token);
    setPendingCount(result.pendingCount);
    if (result.syncedCount) setLastSyncedAt(new Date().toISOString());
    setIsSyncing(false);
    return result;
  }

  return { pendingCount, lastSyncedAt, isSyncing, syncNow };
}

export async function saveLocalDraft<T>(record: LocalDraftRecord<T>) {
  try {
    const db = await openDraftDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    localStorage.setItem(fallbackKey(record.key), JSON.stringify(record));
  }
  return record;
}

export async function enqueueOfflineOperation<T>(operation: Omit<OfflineQueueOperation<T>, "operationId" | "idempotencyKey" | "createdAt" | "retryCount" | "status"> & { operationId?: string; idempotencyKey?: string }) {
  const createdAt = new Date().toISOString();
  const record: OfflineQueueOperation<T> = {
    operationId: operation.operationId ?? crypto.randomUUID(),
    idempotencyKey: operation.idempotencyKey ?? crypto.randomUUID(),
    entityType: operation.entityType,
    patientId: operation.patientId,
    payload: operation.payload,
    endpoint: operation.endpoint,
    method: operation.method,
    createdAt,
    lastAttemptAt: null,
    retryCount: 0,
    status: "pending"
  };
  try {
    const db = await openDraftDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(queueStoreName, "readwrite");
      tx.objectStore(queueStoreName).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    localStorage.setItem(`prij:sync-operation:${record.operationId}`, JSON.stringify(record));
  }
  return record;
}

export async function listOfflineOperations() {
  const records: OfflineQueueOperation[] = [];
  try {
    const db = await openDraftDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(queueStoreName, "readonly");
      const request = tx.objectStore(queueStoreName).getAll();
      request.onsuccess = () => {
        records.push(...(request.result as OfflineQueueOperation[]));
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith("prij:sync-operation:")) continue;
      const raw = localStorage.getItem(key);
      if (raw) records.push(JSON.parse(raw) as OfflineQueueOperation);
    }
  }
  return records;
}

export async function clearSyncedOfflineOperations() {
  const synced = (await listOfflineOperations()).filter((operation) => operation.status === "synced");
  try {
    const db = await openDraftDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(queueStoreName, "readwrite");
      const store = tx.objectStore(queueStoreName);
      synced.forEach((operation) => store.delete(operation.operationId));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    synced.forEach((operation) => localStorage.removeItem(`prij:sync-operation:${operation.operationId}`));
  }
  return synced.length;
}

export async function syncPendingOperations(apiBaseUrl: string, token?: string | null) {
  const operations = (await listOfflineOperations()).filter((operation) => operation.status === "pending" || operation.status === "failed");
  let syncedCount = 0;
  for (const operation of operations) {
    const response = await fetch(`${apiBaseUrl}${operation.endpoint}`, {
      method: operation.method,
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "idempotency-key": operation.idempotencyKey,
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(operation.payload)
    }).catch(() => null);
    await saveQueueOperation({
      ...operation,
      lastAttemptAt: new Date().toISOString(),
      retryCount: operation.retryCount + 1,
      status: response?.ok ? "synced" : "failed"
    });
    if (response?.ok) syncedCount += 1;
  }
  const pendingCount = (await listOfflineOperations()).filter((operation) => operation.status === "pending" || operation.status === "failed").length;
  return { syncedCount, pendingCount };
}

export function autosaveLabel(state: AutosaveState) {
  if (state === "saving") return "Saving...";
  if (state === "saved-local") return "Saved locally";
  if (state === "offline-local") return "Offline - saved on this device";
  if (state === "failed") return "Sync failed - retrying";
  return "Draft ready";
}

async function saveQueueOperation(operation: OfflineQueueOperation) {
  try {
    const db = await openDraftDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(queueStoreName, "readwrite");
      tx.objectStore(queueStoreName).put(operation);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    localStorage.setItem(`prij:sync-operation:${operation.operationId}`, JSON.stringify(operation));
  }
}

function openDraftDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, { keyPath: "key" });
      if (!db.objectStoreNames.contains(queueStoreName)) db.createObjectStore(queueStoreName, { keyPath: "operationId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function fallbackKey(key: string) {
  return `prij:local-draft:${key}`;
}
