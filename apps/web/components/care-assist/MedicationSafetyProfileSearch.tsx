"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { searchMedicationSafetyProfiles, updateMedicationSafetyProfileReview } from "../../lib/care-assist";
import { MedicationSafetyBadge } from "../medications/MedicationSafetyBadge";
import { MedicationSafetyTerminal } from "../medications/MedicationSafetyTerminal";
import type { MedicationResult } from "../../lib/medications";

type Row = {
  id: string;
  legacyPregnancyCategory?: string;
  lactationRiskLevel?: string;
  sourceName?: string;
  sourceYear?: number | null;
  sourceUrl?: string | null;
  lastCheckedAt?: string | null;
  sourceLastUpdatedAt?: string | null;
  sourceRefreshStatus?: string | null;
  reviewStatus?: string;
  confidenceLevel?: string;
  medicationGeneric?: { id?: string; genericName?: string; familyName?: string | null; className?: string | null };
};

export function MedicationSafetyProfileSearch() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [focused, setFocused] = useState<Row | null>(null);
  const [status, setStatus] = useState("Ready");
  const [reviewReason, setReviewReason] = useState("");

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

  async function markReview(reviewStatus: "needs_review" | "reviewed" | "retired") {
    const medicationGenericId = focused?.medicationGeneric?.id;
    if (!focused || !medicationGenericId) {
      setStatus("Select a profile first.");
      return;
    }
    if (reviewStatus === "reviewed" && (!focused.sourceName || focused.sourceName === "Not reviewed" || !reviewReason.trim())) {
      setStatus("Reviewed status requires a source name and review reason.");
      return;
    }
    setStatus("Saving review status");
    try {
      const updated = await updateMedicationSafetyProfileReview(medicationGenericId, {
        legacyPregnancyCategory: focused.legacyPregnancyCategory ?? "REVIEW_REQUIRED",
        lactationRiskLevel: focused.lactationRiskLevel ?? "REVIEW_REQUIRED",
        sourceName: focused.sourceName || "Not reviewed",
        sourceUrl: focused.sourceUrl,
        sourceYear: focused.sourceYear,
        sourceType: reviewStatus === "reviewed" ? "manual_review" : "not_reviewed",
        reviewStatus,
        confidenceLevel: focused.confidenceLevel ?? "unknown",
        lastCheckedAt: focused.lastCheckedAt,
        sourceLastUpdatedAt: focused.sourceLastUpdatedAt,
        sourceRefreshStatus: reviewStatus === "reviewed" ? focused.sourceRefreshStatus ?? "UNKNOWN" : "REVIEW_REQUIRED",
        reviewReason
      });
      const nextFocused = { ...focused, ...updated, reviewStatus };
      setFocused(nextFocused);
      setRows((current) => current.map((row) => row.id === focused.id ? nextFocused : row));
      setStatus(`Profile marked ${reviewStatus.replace("_", " ")}.`);
      setReviewReason("");
    } catch {
      setStatus("Review status was not saved. Owner or Admin access is required.");
    }
  }

  const needingReview = rows.filter((row) => row.reviewStatus !== "reviewed" || row.legacyPregnancyCategory === "REVIEW_REQUIRED" || row.lactationRiskLevel === "REVIEW_REQUIRED");

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Medication Safety Source Review</h2>
          <p className="muted">Prepare pregnancy and lactation source metadata for Owner/Admin review. No safety claims are added here.</p>
        </div>
        <span className="badge warning">{needingReview.length} need review</span>
      </div>
      <form className="inline-form" onSubmit={submit}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search generic name or class" />
        <button className="button" type="submit">Search</button>
      </form>
      <p className="muted">{status}</p>
      <div className="doctor-friendly-grid">
        <div className="data-list">
          {needingReview.map((row) => (
            <button className="data-row" key={row.id} type="button" onClick={() => setFocused(row)} onFocus={() => setFocused(row)} onMouseEnter={() => setFocused(row)}>
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
                <div><dt>Pregnancy status</dt><dd>{row.legacyPregnancyCategory ?? "REVIEW_REQUIRED"}</dd></div>
                <div><dt>Lactation status</dt><dd>{row.lactationRiskLevel ?? "REVIEW_REQUIRED"}</dd></div>
                <div><dt>Source name</dt><dd>{row.sourceName || "Not reviewed"}</dd></div>
                <div><dt>Source year</dt><dd>{row.sourceYear ?? "Not recorded"}</dd></div>
                <div><dt>Source link</dt><dd>{row.sourceUrl || "Not recorded"}</dd></div>
                <div><dt>Last checked</dt><dd>{formatDate(row.lastCheckedAt) || "unknown"}</dd></div>
                <div><dt>Source last updated</dt><dd>{formatDate(row.sourceLastUpdatedAt) || "unknown"}</dd></div>
                <div><dt>Review status</dt><dd>{row.reviewStatus ?? "needs_review"}</dd></div>
                <div><dt>Confidence</dt><dd>{row.confidenceLevel ?? "unknown"}</dd></div>
              </dl>
            </button>
          ))}
          {needingReview.length === 0 ? <div className="empty-state">No profiles need review in this search.</div> : null}
        </div>
        <div>
          <MedicationSafetyTerminal medication={focused ? profileRowToMedication(focused) : null} />
          <section className="panel form-grid">
            <div className="section-heading">
              <h3>Review action</h3>
              <span className="badge warning">Owner/Admin only</span>
            </div>
            <label>
              Review reason
              <textarea value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} placeholder="Required before marking reviewed" />
            </label>
            <div className="form-actions">
              <button className="button secondary" type="button" disabled={!focused} onClick={() => void markReview("needs_review")}>Mark needs review</button>
              <button className="button" type="button" disabled={!focused} onClick={() => void markReview("reviewed")}>Mark reviewed</button>
              <button className="button secondary" type="button" disabled={!focused} onClick={() => void markReview("retired")}>Mark retired</button>
            </div>
            <p className="muted">Reviewed status requires source name, review reason, reviewer, and reviewed time. Reviewer and reviewed time are saved by the server.</p>
          </section>
        </div>
      </div>
    </section>
  );
}

function profileRowToMedication(row: Row): MedicationResult {
  return {
    type: "generic_medication",
    id: row.medicationGeneric?.id ?? row.id,
    genericName: row.medicationGeneric?.genericName ?? "Generic medication",
    familyName: row.medicationGeneric?.familyName,
    className: row.medicationGeneric?.className
  };
}

function formatDate(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}
