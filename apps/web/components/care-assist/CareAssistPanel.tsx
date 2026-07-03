"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { evaluateCareAssist, listCareAssistFindings, type CareAssistFinding } from "../../lib/care-assist";
import { CareAssistFindingCard } from "./CareAssistFindingCard";
import { MissingFieldsCard } from "./MissingFieldsCard";

export function CareAssistPanel({ patientId, historySheetId, prescriptionId, encounterId, investigationOrderId }: { patientId: string; historySheetId?: string; prescriptionId?: string; encounterId?: string; investigationOrderId?: string }) {
  const [findings, setFindings] = useState<CareAssistFinding[]>([]);
  const [status, setStatus] = useState("No check run");

  const load = useCallback(async () => {
    try {
      const data = await listCareAssistFindings(patientId);
      setFindings(data.findings ?? []);
      setStatus(`${data.findings?.length ?? 0} finding(s)`);
    } catch {
      setStatus("Care Assist requires doctor, admin, or owner access");
    }
  }, [patientId]);

  useEffect(() => { void load(); }, [load]);

  async function runCheck() {
    setStatus("Running Care Assist");
    try {
      const data = await evaluateCareAssist({ patientId, historySheetId, prescriptionId, encounterId, investigationOrderId });
      setFindings(data.findings ?? []);
      setStatus(`${data.findings?.length ?? 0} finding(s)`);
    } catch {
      setStatus("Care Assist check was denied or could not run");
    }
  }

  const active = useMemo(() => findings.filter((finding) => finding.status === "ACTIVE" || finding.status === "SNOOZED"), [findings]);
  const groups = groupFindings(active);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Care Assist</h2>
          <p className="muted">Completeness and safety-review prompts only. Doctor review required.</p>
        </div>
        <button className="button" type="button" onClick={() => void runCheck()}>Run Care Assist Check</button>
      </div>
      <p className="muted">{status}</p>
      <MissingFieldsCard findings={active} />
      {Object.entries(groups).map(([label, rows]) => (
        <div className="data-list" key={label}>
          <h3>{label}</h3>
          {rows.map((finding) => <CareAssistFindingCard key={finding.id} finding={finding} onSaved={load} />)}
        </div>
      ))}
    </section>
  );
}

function groupFindings(findings: CareAssistFinding[]) {
  const result: Record<string, CareAssistFinding[]> = {};
  for (const finding of findings) {
    const label = groupLabel(finding.category);
    result[label] = [...(result[label] ?? []), finding];
  }
  return result;
}

function groupLabel(category: string) {
  if (category.includes("HISTORY")) return "History";
  if (category.includes("DOCUMENTATION")) return "Documentation";
  if (category.includes("MEDICATION") || category.includes("PREGNANCY") || category.includes("LACTATION")) return "Medication safety";
  if (category.includes("INVESTIGATION")) return "Investigations";
  if (category.includes("FOLLOW_UP")) return "Follow-up";
  return "Review required";
}
