"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, SafetyAlert } from "../../mvp-page";

import { getApiBaseUrl } from "@/lib/api-base-url";

type AuditEntry = {
  id: string;
  action: string;
  resourceType: string;
  severity: string;
  reason?: string | null;
  createdAt: string;
};

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [error, setError] = useState("");
  const token = useMemo(() => (typeof window === "undefined" ? null : sessionStorage.getItem("prijClinicToken")), []);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/admin/control-center`, {
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    })
      .then(async (response) => {
        if (response.status === 403) throw new Error("Owner or admin access is required.");
        if (!response.ok) throw new Error("Could not load audit entries.");
        const data = await response.json() as { auditLogs?: AuditEntry[] };
        setEntries(data.auditLogs ?? []);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load audit entries."));
  }, [token]);

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Owner tools</p>
            <h1>Audit Log</h1>
          </div>
          <span className="badge accent">Read only</span>
        </div>
        <p className="muted">Recent protected actions. Audit entries are not deleted from the app.</p>
      </section>
      <SafetyAlert />
      {error ? <p className="form-error">{error}</p> : null}
      <section className="panel">
        <div className="data-list">
          {entries.map((entry) => (
            <article className="data-row" key={entry.id}>
              <div className="data-row-header">
                <strong>{entry.action.replaceAll("_", " ").replaceAll(".", " ")}</strong>
                <span className="badge">{entry.severity}</span>
              </div>
              <p className="muted">{entry.resourceType} - {new Date(entry.createdAt).toLocaleString()}</p>
              {entry.reason ? <p className="muted">Reason: {entry.reason}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
