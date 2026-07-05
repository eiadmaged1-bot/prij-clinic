"use client";

import { visitTypes, type VisitTypeValue } from "@/lib/visit-types";

export function VisitTypeSelector({
  value,
  onChange,
  compact = false
}: {
  value: VisitTypeValue | "";
  onChange(value: VisitTypeValue): void;
  compact?: boolean;
}) {
  return (
    <div className="visit-type-selector" data-testid="visit-type-selector">
      <div className="section-heading compact-section-heading">
        <h3>Visit type</h3>
        <span className="badge warning">Required</span>
      </div>
      <div className={compact ? "visit-type-grid compact" : "visit-type-grid"} role="radiogroup" aria-label="Required visit type">
        {visitTypes.map((visitType) => (
          <button
            aria-checked={value === visitType.value}
            className={`visit-type-card ${value === visitType.value ? "active" : ""} ${visitType.urgent ? "urgent-visit-type-card" : ""}`}
            data-visit-type={visitType.value}
            key={visitType.value}
            onClick={() => onChange(visitType.value)}
            role="radio"
            type="button"
          >
            <strong>{visitType.label}</strong>
            <span>{visitType.help}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
