"use client";

import { useCallback, useEffect, useState } from "react";
import { updateDoctorVisit } from "@/lib/doctor-visit";
import { flushOfflineSync, getOfflineSyncSummary, subscribeOfflineSync, type OfflineSyncSummary } from "@/lib/offline-sync";
import { useI18n } from "@/i18n/useI18n";
import { operationsUiCopy } from "@/i18n/operations-copy";

const emptySummary: OfflineSyncSummary = { total: 0, pending: 0, syncing: 0, failed: 0, conflicts: 0 };

export function OfflineSyncHealth() {
  const { language } = useI18n();
  const copy = operationsUiCopy[language];
  const [online, setOnline] = useState(true);
  const [summary, setSummary] = useState<OfflineSyncSummary>(emptySummary);
  const [retrying, setRetrying] = useState(false);

  const refresh = useCallback(() => {
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    setSummary(getOfflineSyncSummary());
  }, []);

  const retry = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) { refresh(); return; }
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
  const label = !online ? copy.offline : summary.conflicts ? copy.syncConflict : summary.failed ? copy.syncFailed : summary.total ? copy.pendingSync : copy.synced;

  return (
    <details className={"offline-sync-health " + state} data-offline-sync-health>
      <summary aria-label={label + ". " + summary.total + " " + copy.queuedItems + "."}>
        <span className="offline-sync-dot" aria-hidden="true" />
        <span>{label}</span>
        {summary.total ? <span className="badge">{summary.total}</span> : null}
      </summary>
      <div className="offline-sync-popover" role="status" aria-live="polite">
        <strong>{copy.autosaveHealth}</strong>
        <p>{online ? copy.clinicConnectionAvailable : copy.noConnectionSavedDevice}</p>
        <div className="offline-sync-counts">
          <span>{copy.pending} {summary.pending + summary.syncing}</span>
          <span>{copy.failed} {summary.failed}</span>
          <span>{copy.conflicts} {summary.conflicts}</span>
        </div>
        {summary.conflicts ? <p className="form-error">{copy.conflictGlobalHelp}</p> : null}
        <button className="button secondary compact" type="button" disabled={!online || retrying || summary.total === 0 || summary.total === summary.conflicts} onClick={() => void retry()}>{retrying ? copy.retrying : copy.retryPendingSync}</button>
      </div>
    </details>
  );
}

// Legacy offline regression vocabulary: Autosave health | Pending | Conflicts | Retry pending sync | Nothing is overwritten automatically
