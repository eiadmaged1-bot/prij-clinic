"use client";

import type { CareAssistFinding } from "../../lib/care-assist";
import { CareAssistDecisionControls } from "./CareAssistDecisionControls";

export function CareAssistFindingCard({ finding, onSaved }: { finding: CareAssistFinding; onSaved: () => void }) {
  const critical = finding.severity === "HIGH" || finding.severity === "CRITICAL_REVIEW";
  return (
    <article className="data-row">
      <div className="data-row-header">
        <strong>{finding.title}</strong>
        <span className={critical ? "badge danger" : "badge warning"}>{finding.severity.replace(/_/g, " ")} review</span>
      </div>
      <p className="muted">{finding.message}</p>
      <dl>
        <div><dt>Group</dt><dd>{friendly(finding.category)}</dd></div>
        <div><dt>Status</dt><dd>{friendly(finding.status)}</dd></div>
        <div><dt>Missing field</dt><dd>{formatList(finding.missingFieldsJson)}</dd></div>
      </dl>
      <p className="warning-text">Reference only. Doctor review required.</p>
      <CareAssistDecisionControls findingId={finding.id} severity={finding.severity} onSaved={onSaved} />
    </article>
  );
}

function friendly(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatList(value: unknown) {
  return Array.isArray(value) ? value.join(", ") : "Review required";
}
