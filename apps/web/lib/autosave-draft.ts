import { useEffect, useMemo, useState } from "react";

export type AutosaveState = "idle" | "saving" | "saved-local" | "offline-local" | "failed";

const dbName = "prij-clinic-local-drafts";
const storeName = "drafts";

export type LocalDraftRecord<T> = {
  key: string;
  entityType: string;
  patientId?: string | null;
  payload: T;
  updatedAt: string;
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

export function autosaveLabel(state: AutosaveState) {
  if (state === "saving") return "Saving...";
  if (state === "saved-local") return "Saved locally";
  if (state === "offline-local") return "Offline - saved on this device";
  if (state === "failed") return "Sync failed - retrying";
  return "Draft ready";
}

function openDraftDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function fallbackKey(key: string) {
  return `prij:local-draft:${key}`;
}
