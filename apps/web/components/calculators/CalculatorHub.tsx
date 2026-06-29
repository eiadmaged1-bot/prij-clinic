"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateFormula, CalculatorFormula, CalculatorResult, listCalculatorFormulas } from "../../lib/calculators";
import { ThreeDMedicalIcon } from "../ThreeDMedicalIcon";
import { CalculatorForm } from "./CalculatorForm";
import { CalculatorResultCard } from "./CalculatorResultCard";
import { FormulaStatusBadge } from "./FormulaStatusBadge";

const categories = ["OB Dating", "OB Ultrasound", "Maternal / Pregnancy", "Gynecology", "General Medical", "Renal", "Electrolytes", "Draft / Unverified"];

export function CalculatorHub() {
  const [formulas, setFormulas] = useState<CalculatorFormula[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("OB Dating");
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listCalculatorFormulas()
      .then((data) => {
        setFormulas(data.formulas);
        setSelectedCode(data.formulas.find((formula) => formula.implementationStatus === "verified")?.code ?? "");
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load calculators."));
  }, []);

  const filtered = useMemo(() => {
    return formulas.filter((formula) => {
      const categoryMatch = category === "Draft / Unverified" ? formula.implementationStatus !== "verified" : formula.category === category;
      const queryMatch = `${formula.name} ${formula.code}`.toLowerCase().includes(query.toLowerCase());
      return categoryMatch && queryMatch;
    });
  }, [category, formulas, query]);
  const selected = formulas.find((formula) => formula.code === selectedCode) ?? filtered[0] ?? null;

  async function submit(payload: Record<string, unknown>) {
    setError("");
    setResult(null);
    try {
      setResult(await calculateFormula(payload));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not calculate.");
    }
  }

  return (
    <>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Clinical calculation infrastructure</p>
            <h1>Medical Calculator Hub</h1>
          </div>
          <span className="badge warning">Doctor review required</span>
        </div>
        <p className="muted">Verified calculators show formula source, units, calculation date, calculated by, and limitations. Draft formulas cannot generate clinical results.</p>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="module-grid">
        {categories.map((item) => (
          <button className={`module-card ${category === item ? "active" : ""}`} key={item} onClick={() => setCategory(item)} type="button">
            <ThreeDMedicalIcon name={item.includes("Ultrasound") ? "ultrasound" : item.includes("OB") ? "pregnancy" : "investigations"} size="sm" />
            <strong>{item}</strong>
          </button>
        ))}
      </section>

      <section className="panel">
        <label>
          Search calculators
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by formula name" />
        </label>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="section-heading">
            <h2>Formula registry</h2>
            <span className="badge">{filtered.length}</span>
          </div>
          <div className="data-list">
            {filtered.map((formula) => (
              <button className="data-row button-row" key={formula.code} onClick={() => setSelectedCode(formula.code)} type="button">
                <div className="data-row-header">
                  <strong>{formula.name}</strong>
                  <FormulaStatusBadge status={formula.implementationStatus} />
                </div>
                <p className="muted">{formula.sourceName} {formula.sourceVersion ?? ""}</p>
              </button>
            ))}
          </div>
        </article>
        <CalculatorForm formula={selected} onSubmit={submit} />
        <CalculatorResultCard result={result} />
      </section>
    </>
  );
}
