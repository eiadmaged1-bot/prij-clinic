import type { CalculatorResult } from "../../lib/calculators";
import { FormulaStatusBadge } from "./FormulaStatusBadge";

export function CalculatorResultCard({ result }: { result: CalculatorResult | null }) {
  if (!result) {
    return (
      <article className="panel">
        <h2>Result</h2>
        <p className="empty-state">Choose a verified formula and enter safe demo inputs.</p>
      </article>
    );
  }

  return (
    <article className="panel">
      <div className="section-heading">
        <div>
          <h2>{result.formula.name}</h2>
          <p className="muted">{result.formula.code}</p>
        </div>
        <FormulaStatusBadge status={result.formula.implementationStatus} />
      </div>
      <dl className="profile-grid">
        {Object.entries(result.output).map(([key, value]) => (
          <div key={key}>
            <dt>{labelize(key)}</dt>
            <dd>{displayValue(value)} {result.units[key] ?? ""}</dd>
          </div>
        ))}
        <div><dt>Calculated</dt><dd>{new Date(result.calculatedAt).toLocaleString()}</dd></div>
        <div><dt>By</dt><dd>{result.calculatedBy.displayName}</dd></div>
        <div><dt>Review</dt><dd>{result.reviewStatus}</dd></div>
        <div className="wide"><dt>Source</dt><dd>{result.formula.sourceName} {result.formula.sourceYear ? `(${result.formula.sourceYear})` : ""} {result.formula.sourceVersion ?? ""}</dd></div>
        <div className="wide"><dt>Limitations</dt><dd>{result.limitations.join(" ")}</dd></div>
      </dl>
    </article>
  );
}

function displayValue(value: unknown) {
  if (value && typeof value === "object" && "display" in value) return String((value as { display?: string }).display);
  return String(value);
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
