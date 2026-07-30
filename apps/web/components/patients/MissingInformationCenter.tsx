"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";

type MissingFinding = { key: string; missingItem: string; context: string; reason: string; severity: string; actionLink: string; state: string };
type Decision = "NOT_APPLICABLE" | "PATIENT_DECLINED" | "AWAITING_EXTERNAL_RESULT" | "DISMISS" | "SNOOZE";

export function MissingInformationCenter({ patientId, canUpdate }: { patientId: string; canUpdate: boolean }) {
  const [findings, setFindings] = useState<MissingFinding[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [status, setStatus] = useState("");
  const grouped = useMemo(() => groupFindings(findings), [findings]);
  const required = findings.filter((finding) => finding.severity === "high").length;
  const recommended = findings.filter((finding) => finding.severity === "medium").length;
  const priorityLabels = findings.filter((finding) => finding.severity === "high").slice(0, 3).map((finding) => finding.missingItem);

  useEffect(() => {
    const controller = new AbortController();
    const token = sessionStorage.getItem("prijClinicToken");
    void fetch(`${getApiBaseUrl()}/patients/${patientId}/missing-information`, { credentials: "include", signal: controller.signal, headers: token ? { authorization: `Bearer ${token}` } : undefined }).then(async (response) => {
      if (!response.ok) throw new Error("missing-information");
      const data = await response.json() as { findings?: MissingFinding[] };
      setFindings(data.findings ?? []); setState("ready");
    }).catch((error) => { if ((error as Error).name !== "AbortError") setState("error"); });
    return () => controller.abort();
  }, [patientId]);

  async function decide(finding: MissingFinding, decision: Decision) {
    const reason = window.prompt("Document the reason")?.trim();
    if (!reason) return;
    const snoozeDate = decision === "SNOOZE" ? window.prompt("Snooze until (YYYY-MM-DD)")?.trim() : undefined;
    if (decision === "SNOOZE" && !snoozeDate) return;
    setStatus("Saving decision…");
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/patients/${patientId}/missing-information/${encodeURIComponent(finding.key)}/decision`, { method: "POST", credentials: "include", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ decision, reason, snoozedUntil: snoozeDate ? `${snoozeDate}T00:00:00.000Z` : undefined }) });
    if (!response.ok) { setStatus("Decision could not be saved. Check permission and retry."); return; }
    setFindings((current) => decision === "AWAITING_EXTERNAL_RESULT" ? current.map((item) => item.key === finding.key ? { ...item, state: "Awaiting result" } : item) : current.filter((item) => item.key !== finding.key));
    setStatus("Decision saved and audited.");
  }

  if (state === "loading") return <section className="panel compact-panel missing-information-panel"><div className="skeleton" aria-label="Loading missing information" /></section>;
  if (state === "error") return <section className="panel compact-panel missing-information-panel"><div className="typed-state error"><p>Information-gap review could not be loaded.</p><button className="button secondary compact" type="button" onClick={() => window.location.reload()}>Retry</button></div></section>;
  if (findings.length === 0) return null;

  return <details className="panel compact-panel missing-information-panel calm-missing-information">
    <summary>
      <div>
        <span className="eyebrow">Safety and completeness</span>
        <strong>{required ? `${required} required item${required === 1 ? "" : "s"}` : `${recommended} recommended item${recommended === 1 ? "" : "s"}`}</strong>
        <small>{priorityLabels.length ? priorityLabels.join(" · ") : "Open to review remaining information gaps"}</small>
      </div>
      <span className={`badge ${required ? "warning" : ""}`}>Review</span>
    </summary>

    <div className="calm-missing-information-body">
      {status ? <p className="muted" role="status">{status}</p> : null}
      {grouped.map(([group, rows]) => <section key={group} className="calm-missing-group">
        <div className="calm-section-title"><h3>{group}</h3><span>{rows.length}</span></div>
        {rows.map((finding) => <article className="calm-missing-row" key={finding.key}>
          <div>
            <strong>{finding.missingItem}</strong>
            <p>{finding.reason}</p>
          </div>
          <div className="calm-missing-actions">
            <a className="button compact" href={finding.actionLink}>Record</a>
            {canUpdate ? <details>
              <summary className="button secondary compact">Other outcome</summary>
              <div>
                <button type="button" onClick={() => void decide(finding, "NOT_APPLICABLE")}>Not applicable</button>
                <button type="button" onClick={() => void decide(finding, "PATIENT_DECLINED")}>Patient declined</button>
                <button type="button" onClick={() => void decide(finding, "AWAITING_EXTERNAL_RESULT")}>Awaiting result</button>
                <button type="button" onClick={() => void decide(finding, "SNOOZE")}>Snooze</button>
                {finding.severity !== "high" ? <button type="button" onClick={() => void decide(finding, "DISMISS")}>Dismiss with reason</button> : null}
              </div>
            </details> : null}
          </div>
        </article>)}
      </section>)}
    </div>
  </details>;
}

function groupFindings(findings: MissingFinding[]) {
  const labels: Record<string, string> = { patient: "Immediate safety", visit: "Visit documentation", pregnancy: "Pregnancy / fertility context", "infertility-cycle": "Pregnancy / fertility context", "investigation-order": "Investigations / results", "investigation-result": "Investigations / results" };
  const groups = new Map<string, MissingFinding[]>();
  for (const finding of findings) { const group = labels[finding.context] ?? "Follow-up"; groups.set(group, [...(groups.get(group) ?? []), finding]); }
  return [...groups.entries()];
}
