import type { PatientCalculation } from "../../lib/calculators";

export function CalculatorHistoryTable({ rows }: { rows: PatientCalculation[] }) {
  return (
    <article className="panel">
      <div className="section-heading">
        <h2>Calculation history</h2>
        <span className="badge">{rows.length} saved</span>
      </div>
      {rows.length === 0 ? <p className="empty-state">No patient-linked calculations saved yet.</p> : null}
      <div className="data-list">
        {rows.map((row) => (
          <article className="data-row" key={row.id}>
            <div className="data-row-header">
              <strong>{row.formula?.name ?? "Calculation"}</strong>
              <span className="badge">{row.status}</span>
            </div>
            <p className="muted">{new Date(row.calculatedAt).toLocaleString()} - {row.formula?.sourceVersion ?? "source recorded"}</p>
          </article>
        ))}
      </div>
    </article>
  );
}
