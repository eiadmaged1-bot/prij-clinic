"use client";

import type { CareAssistFinding } from "../../lib/care-assist";

export function MissingFieldsCard({ findings }: { findings: CareAssistFinding[] }) {
  const missing = findings.filter((finding) => finding.category.includes("COMPLETENESS") || finding.category.includes("HISTORY"));
  return (
    <article className="data-row">
      <div className="data-row-header">
        <strong>Missing field</strong>
        <span className="badge warning">{missing.length} item(s)</span>
      </div>
      <p className="muted">Documentation completeness reminders only. No diagnosis, prescribing, dose, or treatment ranking is generated.</p>
      <div className="chip-list">
        {missing.slice(0, 12).map((finding) => <span className="badge" key={finding.id}>{finding.title}</span>)}
      </div>
    </article>
  );
}
