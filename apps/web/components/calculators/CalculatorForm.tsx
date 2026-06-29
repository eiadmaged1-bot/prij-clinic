"use client";

import { FormEvent } from "react";
import type { CalculatorFormula } from "../../lib/calculators";
import { FormulaStatusBadge } from "./FormulaStatusBadge";

const fieldMap: Record<string, Array<[string, string, string]>> = {
  BMI: [["weightKg", "Weight", "number"], ["heightCm", "Height", "number"]],
  BSA_MOSTELLER: [["weightKg", "Weight", "number"], ["heightCm", "Height", "number"]],
  CORRECTED_CALCIUM: [["calciumMgDl", "Calcium", "number"], ["albuminGdl", "Albumin", "number"]],
  ANION_GAP: [["sodiumMmolL", "Sodium", "number"], ["chlorideMmolL", "Chloride", "number"], ["bicarbonateMmolL", "Bicarbonate", "number"]],
  SERUM_OSMOLALITY: [["sodiumMmolL", "Sodium", "number"], ["glucoseMgDl", "Glucose", "number"], ["bunMgDl", "BUN", "number"]],
  EGFR_CKD_EPI_2021_CREATININE: [["sex", "Sex", "text"], ["ageYears", "Age", "number"], ["serumCreatinineMgDl", "Serum creatinine", "number"]],
  CREATININE_CLEARANCE_COCKCROFT_GAULT: [["sex", "Sex", "text"], ["ageYears", "Age", "number"], ["weightKg", "Weight", "number"], ["serumCreatinineMgDl", "Serum creatinine", "number"]],
  OB_EDD_FROM_LMP: [["lmpDate", "LMP date", "date"]],
  OB_EDD_FROM_LMP_CYCLE_LENGTH: [["lmpDate", "LMP date", "date"], ["cycleLengthDays", "Cycle length", "number"]],
  OB_EDD_FROM_CONCEPTION_DATE: [["conceptionDate", "Conception date", "date"]],
  OB_EDD_FROM_KNOWN_EDD: [["knownEdd", "Known EDD", "date"]],
  OB_EDD_FROM_GA_ON_DATE: [["assessmentDate", "Known date", "date"], ["gaWeeks", "GA weeks", "number"], ["gaDays", "GA days", "number"]],
  OB_EDD_FROM_ULTRASOUND_GA_ON_DATE: [["scanDate", "Scan date", "date"], ["gaWeeks", "GA weeks", "number"], ["gaDays", "GA days", "number"]]
};

export function CalculatorForm({ formula, onSubmit }: { formula: CalculatorFormula | null; onSubmit: (payload: Record<string, unknown>) => void }) {
  if (!formula) {
    return (
      <article className="panel">
        <h2>Formula</h2>
        <p className="empty-state">Select a calculator to begin.</p>
      </article>
    );
  }

  const fields = fieldMap[formula.code] ?? [];
  const verified = formula.implementationStatus === "verified";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => {
      const raw = String(value).trim();
      return [key, event.currentTarget.elements.namedItem(key) instanceof HTMLInputElement && (event.currentTarget.elements.namedItem(key) as HTMLInputElement).type === "number" ? Number(raw) : raw];
    }).filter(([, value]) => value !== ""));
    onSubmit({ formulaCode: formula!.code, input });
  }

  return (
    <article className="panel">
      <div className="section-heading">
        <div>
          <h2>{formula.name}</h2>
          <p className="muted">{formula.sourceName} {formula.sourceVersion ?? ""}</p>
        </div>
        <FormulaStatusBadge status={formula.implementationStatus} />
      </div>
      {!verified ? (
        <p className="notice safety-note">Formula exists in catalog but is not verified for clinical use yet.</p>
      ) : null}
      <form className="form-grid" onSubmit={submit}>
        {fields.map(([name, label, type]) => (
          <label key={name}>
            {label}
            <input name={name} required type={type} step={type === "number" ? "0.01" : undefined} />
          </label>
        ))}
        {fields.length === 0 ? <p className="muted wide">This entry is available for catalog review only. Clinical output is disabled until a verified handler is implemented.</p> : null}
        <button className="button wide" disabled={!verified} type="submit">Calculate</button>
      </form>
    </article>
  );
}
