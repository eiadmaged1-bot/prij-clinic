"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { searchMedicationSafetyProfiles } from "../../lib/care-assist";
import { MedicationSafetyBadge } from "../medications/MedicationSafetyBadge";

type Row = {
  id: string;
  legacyPregnancyCategory?: string;
  lactationRiskLevel?: string;
  sourceName?: string;
  reviewStatus?: string;
  confidenceLevel?: string;
  medicationGeneric?: { genericName?: string; familyName?: string | null; className?: string | null };
};

export function MedicationSafetyProfileSearch() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("Ready");

  const submit = useCallback(async (event?: FormEvent) => {
    event?.preventDefault();
    setStatus("Searching");
    try {
      const data = await searchMedicationSafetyProfiles(query);
      setRows((data.results ?? []) as Row[]);
      setStatus(`${data.results?.length ?? 0} profile(s)`);
    } catch {
      setStatus("Medication safety profiles require authorized clinical access");
    }
  }, [query]);

  useEffect(() => { void submit(); }, [submit]);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Medication Safety Profiles</h2>
          <p className="muted">Pregnancy and lactation reference metadata. Doctor review required.</p>
        </div>
        <span className="badge warning">No category E</span>
      </div>
      <form className="inline-form" onSubmit={submit}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search generic name or class" />
        <button className="button" type="submit">Search</button>
      </form>
      <p className="muted">{status}</p>
      <div className="data-list">
        {rows.map((row) => (
          <article className="data-row" key={row.id}>
            <div className="data-row-header">
              <strong>{row.medicationGeneric?.genericName ?? "Generic medication"}</strong>
              <span className="badge">{row.reviewStatus ?? "needs_review"}</span>
            </div>
            <div className="chip-list">
              <MedicationSafetyBadge label="Legacy pregnancy category" value={row.legacyPregnancyCategory} />
              <MedicationSafetyBadge label="Lactation profile" value={row.lactationRiskLevel} />
            </div>
            <dl>
              <div><dt>Class/family</dt><dd>{[row.medicationGeneric?.familyName, row.medicationGeneric?.className].filter(Boolean).join(" / ") || "Not listed"}</dd></div>
              <div><dt>Source</dt><dd>{row.sourceName || "Not reviewed"}</dd></div>
              <div><dt>Confidence</dt><dd>{row.confidenceLevel ?? "unknown"}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
