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

  return <section className="panel compact-panel missing-information-panel" aria-labelledby="missing-information-title">
    <div className="section-heading"><div><h2 id="missing-information-title">Missing information</h2><p className="muted">{required} required · {recommended} recommended · {Math.max(0, findings.length - required - recommended)} low priority</p></div></div>
    {status ? <p className="muted" role="status">{status}</p> : null}
    {state === "loading" ? <div className="skeleton" aria-label="Loading missing information" /> : state === "error" ? <div className="typed-state error"><p>Missing-information review could not be loaded.</p><button className="button secondary compact" type="button" onClick={() => window.location.reload()}>Retry</button></div> : findings.length === 0 ? <p className="empty-state compact">No active information gaps.</p> : <div className="missing-information-groups">{grouped.map(([group, rows]) => <details key={group} open={rows.some((item) => item.severity === "high")}><summary><strong>{group}</strong><span className="badge">{rows.length}</span></summary><div className="dense-card-list">{rows.map((finding) => <article className="data-row compact" key={finding.key}><div><strong>{finding.missingItem}</strong><span className={`badge ${finding.severity === "high" ? "warning" : ""}`}>{finding.state}</span></div><p>{finding.reason}</p><div className="form-actions"><a className="button compact" href={finding.actionLink}>Record now</a>{canUpdate ? <><button type="button" onClick={() => void decide(finding, "NOT_APPLICABLE")}>Not applicable</button><button type="button" onClick={() => void decide(finding, "PATIENT_DECLINED")}>Patient declined</button><button type="button" onClick={() => void decide(finding, "AWAITING_EXTERNAL_RESULT")}>Awaiting result</button><button type="button" onClick={() => void decide(finding, "SNOOZE")}>Snooze</button>{finding.severity !== "high" ? <button type="button" onClick={() => void decide(finding, "DISMISS")}>Dismiss with reason</button> : null}</> : null}</div></article>)}</div></details>)}</div>}
  </section>;
}

function groupFindings(findings: MissingFinding[]) {
  const labels: Record<string, string> = { patient: "Immediate safety", visit: "Visit documentation", pregnancy: "Pregnancy / fertility context", "infertility-cycle": "Pregnancy / fertility context", "investigation-order": "Investigations / results", "investigation-result": "Investigations / results" };
  const groups = new Map<string, MissingFinding[]>();
  for (const finding of findings) { const group = labels[finding.context] ?? "Follow-up"; groups.set(group, [...(groups.get(group) ?? []), finding]); }
  return [...groups.entries()];
}
