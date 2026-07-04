"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, SafetyAlert } from "../../mvp-page";

import { getApiBaseUrl } from "@/lib/api-base-url";

type AuditEntry = {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
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
                <strong>{auditActionLabel(entry.action)}</strong>
                <span className={severityBadgeClass(entry.severity)}>{severityLabel(entry.severity)}</span>
              </div>
              <dl>
                <div><dt>Record</dt><dd>{resourceLabel(entry.resourceType)}</dd></div>
                <div><dt>When</dt><dd>{new Date(entry.createdAt).toLocaleString()}</dd></div>
                {entry.resourceId ? <div><dt>Reference</dt><dd>{entry.resourceId.slice(0, 8)}</dd></div> : null}
                {entry.reason ? <div className="wide"><dt>Reason</dt><dd>{entry.reason}</dd></div> : null}
              </dl>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function auditActionLabel(action: string) {
  const known: Record<string, string> = {
    "appointment.created": "Appointment created",
    "queue.checked_in": "Patient checked in",
    "encounter.created": "Visit draft created",
    "encounter.updated": "Visit draft updated",
    "encounter.signed": "Visit note signed",
    "prescription.created": "Prescription draft created",
    "investigation_order.created": "Investigation order created",
    "report.created": "Report metadata created",
    "invoice.created": "Invoice created",
    "payment.recorded": "Payment recorded",
    "consent.created": "Consent recorded",
    "system_setting.appearance_updated": "Appearance settings updated"
  };

  return known[action] ?? action.replaceAll("_", " ").replaceAll(".", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function resourceLabel(resourceType: string) {
  const known: Record<string, string> = {
    system_setting: "System setting",
    patient: "Patient file",
    encounter: "Visit note",
    prescription: "Prescription",
    investigation_order: "Investigation order",
    invoice: "Invoice",
    payment: "Payment"
  };

  return known[resourceType] ?? resourceType.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function severityLabel(severity: string) {
  if (severity === "high") return "High importance";
  if (severity === "medium") return "Review";
  if (severity === "low") return "Routine";
  return severity || "Audit";
}

function severityBadgeClass(severity: string) {
  if (severity === "high") return "badge danger";
  if (severity === "medium") return "badge warning";
  return "badge";
}
