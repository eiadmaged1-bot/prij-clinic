"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  commitMedicationSafetyImport,
  decideMedicationSafetyProfileReview,
  listMedicationSafetyImportJobs,
  listMedicationSafetyReviewQueue,
  previewMedicationSafetyImport,
  searchMedicationSafetyProfiles,
  type MedicationSafetyImportPreview
} from "../../lib/care-assist";
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
  reviewedAt?: string | null;
  reviewedByUser?: { displayName?: string | null; email?: string | null } | null;
  medicationGeneric?: { id?: string; genericName?: string; familyName?: string | null; className?: string | null };
};

type ImportJob = { id: string; resourceId?: string | null; createdAt: string; metadataJson?: unknown };

export function MedicationSafetyProfileSearch() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [focused, setFocused] = useState<Row | null>(null);
  const [status, setStatus] = useState("Ready");
  const [reviewReason, setReviewReason] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [preview, setPreview] = useState<MedicationSafetyImportPreview | null>(null);
  const [jobs, setJobs] = useState<ImportJob[]>([]);

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

  const loadReviewQueue = useCallback(async () => {
    try {
      const data = await listMedicationSafetyReviewQueue();
      setRows((data.results ?? []) as Row[]);
    } catch {
      setStatus("Review queue requires Owner or Admin access.");
    }
  }, []);

  const loadJobs = useCallback(async () => {
    try {
      const data = await listMedicationSafetyImportJobs();
      setJobs(data.jobs ?? []);
    } catch {
      setJobs([]);
    }
  }, []);

  useEffect(() => {
    void loadReviewQueue();
    void loadJobs();
  }, [loadJobs, loadReviewQueue]);

  async function readSourceFile(file?: File) {
    if (!file) return;
    setFileName(file.name);
    setFileContent(await file.text());
    setPreview(null);
    setStatus("Source file loaded for preview.");
  }

  async function previewImport() {
    if (!fileContent.trim()) {
      setStatus("Choose a CSV, JSON, or structured text file first.");
      return;
    }
    setStatus("Checking source file");
    try {
      const data = await previewMedicationSafetyImport({ fileName: fileName || "owner-source.csv", content: fileContent });
      setPreview(data);
      setStatus(`Preview complete: ${data.summary.accepted} accepted, ${data.summary.rejected} rejected.`);
    } catch {
      setStatus("Import preview failed. Check the file columns and values.");
    }
  }

  async function commitImport() {
    if (!preview?.accepted.length) {
      setStatus("Preview accepted rows before committing.");
      return;
    }
    setStatus("Committing accepted rows as review required");
    try {
      const data = await commitMedicationSafetyImport({ fileName: fileName || "owner-source.csv", content: fileContent });
      setStatus(`Import committed: ${data.createdOrUpdated} profile(s) set to review required.`);
      await loadReviewQueue();
      await loadJobs();
    } catch {
      setStatus("Import was not committed. Owner or Admin access is required.");
    }
  }

  async function decideReview(decision: "approve" | "reject" | "retire") {
    if (!focused) {
      setStatus("Select a profile first.");
      return;
    }
    if (!reviewReason.trim()) {
      setStatus("A review reason is required.");
      return;
    }
    if (decision === "approve" && (!focused.sourceName || focused.sourceName === "Not reviewed")) {
      setStatus("Approval requires source metadata.");
      return;
    }
    setStatus("Saving review decision");
    try {
      const updated = await decideMedicationSafetyProfileReview(focused.id, { decision, reason: reviewReason });
      const nextFocused = { ...focused, ...updated };
      setFocused(nextFocused);
      setRows((current) => current.map((row) => row.id === focused.id ? nextFocused : row));
      setStatus(`Review decision saved: ${decision}.`);
      setReviewReason("");
    } catch {
      setStatus("Review decision was not saved. Check source metadata, reason, and access.");
    }
  }

  const needingReview = rows.filter((row) => row.reviewStatus !== "reviewed" || row.legacyPregnancyCategory === "REVIEW_REQUIRED" || row.lactationRiskLevel === "REVIEW_REQUIRED");

  return (
    <section className="stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Import Source File</h2>
            <p className="muted">Owner/Admin controlled source import. Accepted rows stay review required until a reviewer acts.</p>
          </div>
          <span className="badge warning">Review required default</span>
        </div>
        <div className="form-grid">
          <label>
            Source file
            <input accept=".csv,.json,.txt" type="file" onChange={(event) => void readSourceFile(event.target.files?.[0])} />
          </label>
          <label>
            File name
            <input value={fileName} onChange={(event) => setFileName(event.target.value)} placeholder="owner-source.csv" />
          </label>
          <div className="form-actions">
            <button className="button secondary" type="button" onClick={() => void previewImport()}>Preview import</button>
            <button className="button" type="button" disabled={!preview?.accepted.length} onClick={() => void commitImport()}>Commit accepted rows</button>
          </div>
        </div>
        {preview ? (
          <div className="data-list">
            <div className="data-row">
              <div className="data-row-header">
                <strong>Preview results</strong>
                <span className="badge">{preview.summary.accepted} accepted</span>
              </div>
              <p className="muted">{preview.summary.rejected} rejected, {preview.summary.warnings} warning(s). Preview does not change profiles.</p>
            </div>
            {preview.accepted.slice(0, 25).map((row) => (
              <div className="data-row" key={`accepted-${row.rowNumber}`}>
                <div className="data-row-header">
                  <strong>{row.genericName}</strong>
                  <span className="badge warning">Review required</span>
                </div>
                <div className="chip-list">
                  <MedicationSafetyBadge label="Legacy pregnancy category" value={row.legacyPregnancyCategory} />
                  <MedicationSafetyBadge label="Lactation profile" value={row.lactationRiskLevel} />
                </div>
                <p className="muted">{row.sourceName} {row.sourceYear ? `- ${row.sourceYear}` : ""}</p>
                {row.warnings.length ? <p className="warning-text">{row.warnings.join(" ")}</p> : null}
              </div>
            ))}
            {preview.rejected.map((row) => (
              <div className="data-row" key={`rejected-${row.rowNumber}`}>
                <div className="data-row-header">
                  <strong>Row {row.rowNumber}</strong>
                  <span className="badge danger">Rejected</span>
                </div>
                <p className="warning-text">{row.errors.join(" ")}</p>
                {row.warnings.length ? <p className="muted">{row.warnings.join(" ")}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
        {jobs.length ? (
          <div className="data-list">
            <h3>Recent imports</h3>
            {jobs.slice(0, 5).map((job) => (
              <div className="data-row" key={job.id}>
                <strong>{job.resourceId ?? "Import job"}</strong>
                <p className="muted">{formatDate(job.createdAt) || "unknown date"}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

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
                <div><dt>Reviewed by</dt><dd>{row.reviewedByUser?.displayName ?? row.reviewedByUser?.email ?? "Not recorded"}</dd></div>
                <div><dt>Reviewed at</dt><dd>{formatDate(row.reviewedAt) || "Not recorded"}</dd></div>
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
              <button className="button" type="button" disabled={!focused} onClick={() => void decideReview("approve")}>Approve</button>
              <button className="button secondary" type="button" disabled={!focused} onClick={() => void decideReview("reject")}>Reject</button>
              <button className="button secondary" type="button" disabled={!focused} onClick={() => void decideReview("retire")}>Retire</button>
            </div>
            <p className="muted">Reviewed status requires source name, review reason, reviewer, and reviewed time. Reviewer and reviewed time are saved by the server.</p>
          </section>
        </div>
      </div>
    </section>
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
