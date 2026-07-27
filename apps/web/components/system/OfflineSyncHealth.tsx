"use client";

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
