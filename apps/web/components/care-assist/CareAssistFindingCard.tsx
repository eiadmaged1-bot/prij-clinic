"use client";

import type { CareAssistFinding } from "../../lib/care-assist";
import { CareAssistDecisionControls } from "./CareAssistDecisionControls";

export function CareAssistFindingCard({ finding, onSaved }: { finding: CareAssistFinding; onSaved: () => void }) {
  const critical = finding.severity === "HIGH" || finding.severity === "CRITICAL_REVIEW";
  const context = finding.suggestedActionJson && typeof finding.suggestedActionJson === "object" ? finding.suggestedActionJson as ContextDetails : null;
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
      {context ? <section className="compact-panel context-explanation"><h4>Why this appeared</h4><p>{context.whyItAppeared}</p><ContextList label="Facts used" values={context.factsUsed} /><ContextList label="Missing information" values={context.missingInformation} /><ContextList label="Related pathway" values={context.relatedPathway ? [context.relatedPathway] : []} /><ContextList label="Related medicines" values={context.relatedMedicines} /><ContextList label="Related investigations" values={context.relatedInvestigations} /><div className="form-actions">{context.actions?.filter((action) => action.type === "link" && action.href?.startsWith("/")).map((action) => <a className="button secondary compact" href={action.href} key={`${action.label}-${action.href}`}>{action.label}</a>)}</div></section> : null}
      {finding.sourceJson && typeof finding.sourceJson === "object" ? <p className="muted">Source: {String((finding.sourceJson as Record<string, unknown>).sourceType ?? "local rule")} · Version {String((finding.sourceJson as Record<string, unknown>).version ?? "not recorded")}</p> : null}
      <p className="warning-text">Reference only. Doctor review required.</p>
      <CareAssistDecisionControls findingId={finding.id} severity={finding.severity} onSaved={onSaved} />
    </article>
  );
}

type ContextDetails = { whyItAppeared?: string; factsUsed?: string[]; missingInformation?: string[]; relatedPathway?: string; relatedMedicines?: string[]; relatedInvestigations?: string[]; actions?: Array<{ label: string; type: string; href?: string }> };

function ContextList({ label, values = [] }: { label: string; values?: string[] }) {
  return values.length ? <div><strong>{label}</strong><ul>{values.map((value) => <li key={value}>{value}</li>)}</ul></div> : null;
}

function friendly(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatList(value: unknown) {
  return Array.isArray(value) ? value.join(", ") : "Review required";
}
