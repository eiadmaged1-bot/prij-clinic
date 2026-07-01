"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell, SafetyAlert } from "../../mvp-page";
import { CalculatorFormula } from "../../../lib/calculators";
import { FormulaStatusBadge } from "../../../components/calculators/FormulaStatusBadge";

import { getApiBaseUrl } from "@/lib/api-base-url";

export default function AdminCalculatorsPage() {
  const [formulas, setFormulas] = useState<CalculatorFormula[]>([]);
  const [selected, setSelected] = useState<CalculatorFormula | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const response = await fetch(`${getApiBaseUrl()}/admin/calculators`, { credentials: "include", headers: authHeaders() });
    if (!response.ok) {
      setStatus(response.status === 403 ? "Owner or Admin access is required." : "Could not load formula registry.");
      return;
    }
    const data = await response.json() as { formulas: CalculatorFormula[] };
    setFormulas(data.formulas);
    setSelected(data.formulas[0] ?? null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      implementationStatus: String(form.get("implementationStatus") ?? selected.implementationStatus),
      sourceName: String(form.get("sourceName") ?? selected.sourceName),
      sourceVersion: String(form.get("sourceVersion") ?? selected.sourceVersion ?? ""),
      active: form.get("active") === "on",
      limitationsJson: { warnings: String(form.get("warnings") ?? "").split("\n").map((line) => line.trim()).filter(Boolean) },
      reason: String(form.get("reason") ?? "")
    };
    const response = await fetch(`${getApiBaseUrl()}/admin/calculators/${selected.code}`, {
      method: "PATCH",
      credentials: "include",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: string } | null;
      setStatus(body?.message ?? "Could not update formula metadata.");
      return;
    }
    setStatus("Formula metadata updated and audited.");
    await load();
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Admin governance</p>
            <h1>Calculator Formula Registry</h1>
          </div>
          <span className="badge warning">Metadata only</span>
        </div>
        <p className="muted">Formula logic cannot be edited here. Verification requires reviewed handler implementation and an audit reason.</p>
      </section>
      <SafetyAlert />
      {status ? <p className="notice">{status}</p> : null}
      <section className="dashboard-grid">
        <article className="panel">
          <div className="section-heading">
            <h2>Formulas</h2>
            <span className="badge">{formulas.length}</span>
          </div>
          <div className="data-list">
            {formulas.map((formula) => (
              <button className="data-row button-row" key={formula.code} onClick={() => setSelected(formula)} type="button">
                <div className="data-row-header">
                  <strong>{formula.name}</strong>
                  <FormulaStatusBadge status={formula.implementationStatus} />
                </div>
                <p className="muted">{formula.category} - {formula.sourceName}</p>
              </button>
            ))}
          </div>
        </article>
        {selected ? (
          <article className="panel">
            <div className="section-heading">
              <div>
                <h2>{selected.name}</h2>
                <p className="muted">{selected.code}</p>
              </div>
              <FormulaStatusBadge status={selected.implementationStatus} />
            </div>
            <form className="form-grid" onSubmit={save}>
              <label>Status<select name="implementationStatus" defaultValue={selected.implementationStatus}><option value="verified">Verified</option><option value="draft">Draft</option><option value="catalog_only">Catalog only</option><option value="retired">Retired</option></select></label>
              <label>Source<input name="sourceName" defaultValue={selected.sourceName} /></label>
              <label>Version<input name="sourceVersion" defaultValue={selected.sourceVersion ?? ""} /></label>
              <label className="wide">Warnings<textarea name="warnings" defaultValue={(selected.warnings ?? []).join("\n")} /></label>
              <label><input name="active" type="checkbox" defaultChecked /> Active</label>
              <label className="wide">Reason<input name="reason" required placeholder="Required for every registry change" /></label>
              <button className="button wide" type="submit">Save metadata</button>
            </form>
          </article>
        ) : null}
      </section>
    </AppShell>
  );
}

function authHeaders() {
  const token = typeof window === "undefined" ? null : sessionStorage.getItem("prijClinicToken");
  return { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) };
}
