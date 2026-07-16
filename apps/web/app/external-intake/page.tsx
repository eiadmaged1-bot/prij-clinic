"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { AppShell } from "../mvp-page";
import { attachSubmissionToPatient, createPatientFromSubmission, ExternalIntakeSubmission, listExternalIntake, rejectExternalSubmission, requestExternalIntakeCorrection } from "@/lib/external-intake";
import { PatientPicker } from "@/components/clinic/PatientPicker";
import { useI18n } from "../../i18n/useI18n";
import { getApiBaseUrl } from "@/lib/api-base-url";

const mappedFields = [
  ["fullName", "Full name"],
  ["phone", "Phone"],
  ["address", "Address"],
  ["husbandName", "Husband name"],
  ["dateOfBirth", "Date of birth"],
  ["caseType", "Case type"],
  ["mainComplaint", "Main complaint"],
  ["notes", "Notes"]
] as const;

export default function ExternalIntakePage() {
  const { t } = useI18n();
  const [submissions, setSubmissions] = useState<ExternalIntakeSubmission[]>([]);
  const [status, setStatus] = useState("Loading");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"google-forms" | "google-sheets" | "excel-csv" | "manual" | "history" | "import-history" | "corrections" | "data-hygiene" | "quarantined">("google-forms");

  const visibleSubmissions = submissions.filter((submission) => tab === "google-forms" ? submission.source === "google_form" : tab === "google-sheets" ? submission.source === "google_sheet" : tab === "corrections" ? submission.status === "correction_requested" : tab === "history" ? submission.status !== "pending_review" : tab === "manual" ? submission.source === "manual" : true);
  const selected = visibleSubmissions.find((submission) => submission.id === selectedId) ?? visibleSubmissions[0] ?? null;

  async function load() {
    setStatus("Loading");
    try {
      const result = await listExternalIntake(["history", "corrections"].includes(tab) ? "" : "pending_review");
      setSubmissions(result.submissions);
      setSelectedId((current) => current ?? result.submissions[0]?.id ?? null);
      setStatus("Ready");
    } catch (error) {
      setSubmissions([]);
      setStatus(error instanceof Error ? error.message : "Could not load external intake.");
    }
  }

  useEffect(() => {
    void load();
  }, [tab]);

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">{t("intakeCenter")}</p>
            <h1>Patient Submissions Review</h1>
            <p className="muted">Google Form submissions stay pending until Owner/Admin/Doctor review.</p>
          </div>
          <button className="button secondary compact" type="button" onClick={() => void load()}>
            <ThreeDMedicalIcon name="search" size="sm" tone="slate" />Refresh
          </button>
        </div>
      </section>

      <nav className="patient-tabs simple" aria-label={t("intakeCenter")}><button className={tab === "google-forms" ? "active" : ""} type="button" onClick={() => setTab("google-forms")}>{t("googleForms")}</button><button className={tab === "google-sheets" ? "active" : ""} type="button" onClick={() => setTab("google-sheets")}>{t("googleSheets")}</button><button className={tab === "excel-csv" ? "active" : ""} type="button" onClick={() => setTab("excel-csv")}>{t("excelCsv")}</button><button className={tab === "manual" ? "active" : ""} type="button" onClick={() => setTab("manual")}>{t("manualEntry")}</button><button className={tab === "import-history" ? "active" : ""} type="button" onClick={() => setTab("import-history")}>{t("importHistory")}</button><button className={tab === "history" ? "active" : ""} type="button" onClick={() => setTab("history")}>{t("submissionHistory")}</button><button className={tab === "corrections" ? "active" : ""} type="button" onClick={() => setTab("corrections")}>{t("corrections")}</button><button className={tab === "data-hygiene" ? "active" : ""} type="button" onClick={() => setTab("data-hygiene")}>{t("dataHygiene")}</button><button className={tab === "quarantined" ? "active" : ""} type="button" onClick={() => setTab("quarantined")}>{t("testQuarantinedOwner")}</button></nav>

      {tab === "excel-csv" ? <section className="panel"><h2>Excel/CSV staged import</h2><p className="muted">Files are parsed locally, validated, and staged for row-by-row review. No patient or clinical record is created during preview.</p><Link className="button" href="/patients/import">Open Excel/CSV review center</Link></section> : null}
      {tab === "manual" ? <section className="panel compact-panel"><h2>Manual patient entry</h2><p className="muted">Open the authorized patient form. Creating a patient does not create a visit, queue ticket, investigation, prescription, or ultrasound.</p><Link className="button" href="/patients/new">Open manual entry</Link></section> : null}
      {tab === "import-history" ? <ImportBatchHistory /> : null}
      {tab === "data-hygiene" ? <section className="panel"><h2>Audited Data Hygiene</h2><p className="muted">Owner review supports Mark Real, Mark Test, Quarantine, and Restore. Detection signals never classify or delete records automatically.</p><Link className="button secondary" href="/admin/data-hygiene">Open Owner review</Link></section> : null}
      {tab === "quarantined" ? <section className="panel"><h2>Owner review</h2><p className="muted">Confirmed TEST and QUARANTINED submissions remain outside the operational inbox.</p><Link className="button secondary" href="/admin/data-hygiene">Open Data Hygiene</Link></section> : null}

      {!['excel-csv', 'manual', 'import-history', 'data-hygiene', 'quarantined'].includes(tab) ? <section className="content-grid intake-review-grid">
        <div className="panel compact-panel">
          <div className="section-heading"><h2>Pending submissions</h2><span className="badge">{status}</span></div>
          {submissions.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="files" size="sm" tone="slate" /><span>No pending external submissions.</span></p> : null}
          <div className="data-list">
            {visibleSubmissions.map((submission) => {
              const mapped = objectValue(submission.mappedPatientJson);
              const caseType = objectValue(submission.mappedCaseTypeJson);
              const duplicates = Array.isArray(submission.duplicateCandidatesJson) ? submission.duplicateCandidatesJson.length : 0;
              return (
                <button className={`data-row intake-row-button ${selected?.id === submission.id ? "active" : ""}`} key={submission.id} type="button" onClick={() => setSelectedId(submission.id)}>
                  <div className="data-row-header">
                    <strong>{String(mapped.fullName ?? "Unnamed submission")}</strong>
                    <span className="badge">{submission.status}</span>
                  </div>
                  <p className="muted">{String(mapped.phone ?? "No phone")} | {String(mapped.caseType ?? "No case type")} | {String(caseType.patientType ?? "WOMEN_HEALTH")}</p>
                  {duplicates ? <span className="form-warning">Duplicate warning: {duplicates} candidate(s)</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <SubmissionDetail submission={selected} onChanged={load} />
      </section> : null}
    </AppShell>
  );
}

type ImportBatchSummary = { id: string; fileName: string; status: string; rowCount: number; importedCount: number; skippedCount: number; failedCount: number; createdAt: string; createdBy?: { displayName?: string } };

function ImportBatchHistory() {
  const [batches, setBatches] = useState<ImportBatchSummary[]>([]);
  const [status, setStatus] = useState("Loading import history");
  async function load() {
    const response = await authenticatedRequest("/patient-import");
    if (!response.ok) return setStatus(response.status === 403 ? "You do not have permission to view patient import history." : "Import history could not be loaded.");
    const body = await response.json() as { batches?: ImportBatchSummary[] }; setBatches(body.batches ?? []); setStatus(body.batches?.length ? `${body.batches.length} recent batches` : "No import batches found.");
  }
  useEffect(() => { void load(); }, []);
  async function rollback(batch: ImportBatchSummary) {
    const reason = window.prompt("Reason for constrained rollback")?.trim(); if (!reason) return;
    const response = await authenticatedRequest(`/patient-import/${batch.id}/rollback`, "POST", { reason });
    const body = await response.json().catch(() => ({})) as { rolledBack?: number; blocked?: unknown[]; message?: string };
    setStatus(response.ok ? body.message ?? `Rolled back ${body.rolledBack ?? 0} unreferenced imported patients.` : "Rollback request failed.");
    await load();
  }
  return <section className="panel"><div className="section-heading"><h2>Import batch history</h2><span className="badge">{status}</span></div><div className="data-table-wrap"><table className="data-table"><thead><tr><th>File</th><th>Created</th><th>Status</th><th>Rows</th><th>Imported</th><th>Skipped</th><th>Failed</th><th>Action</th></tr></thead><tbody>{batches.map((batch) => <tr key={batch.id}><td>{batch.fileName}</td><td>{formatDate(batch.createdAt)}</td><td><span className="badge">{batch.status}</span></td><td>{batch.rowCount}</td><td>{batch.importedCount}</td><td>{batch.skippedCount}</td><td>{batch.failedCount}</td><td><button className="button secondary compact" type="button" disabled={!batch.status.startsWith("completed")} onClick={() => void rollback(batch)}>Constrained rollback</button></td></tr>)}</tbody></table></div>{!batches.length ? <p className="empty-state compact">No import batches found.</p> : null}<p className="form-warning">Rollback is refused if any imported patient has dependent clinical or operational records.</p></section>;
}

async function authenticatedRequest(path: string, method = "GET", payload?: object) {
  const token = sessionStorage.getItem("prijClinicToken");
  return fetch(`${getApiBaseUrl()}${path}`, { method, credentials: "include", headers: { ...(payload ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: payload ? JSON.stringify(payload) : undefined }).catch(() => new Response(null, { status: 503 }));
}

function SubmissionDetail({ submission, onChanged }: { submission: ExternalIntakeSubmission | null; onChanged(): Promise<void> }) {
  const [reviewReason, setReviewReason] = useState("");
  const [patientId, setPatientId] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setReviewReason("");
    setPatientId("");
    setStatus("");
  }, [submission?.id]);

  if (!submission) {
    return (
      <section className="panel">
        <p className="empty-state"><ThreeDMedicalIcon name="files" size="sm" tone="slate" /><span>Select a pending submission.</span></p>
      </section>
    );
  }

  const currentSubmission = submission;
  const mapped = objectValue(currentSubmission.mappedPatientJson);
  const caseType = objectValue(currentSubmission.mappedCaseTypeJson);
  const duplicates = Array.isArray(currentSubmission.duplicateCandidatesJson) ? currentSubmission.duplicateCandidatesJson : [];

  async function action(event: FormEvent<HTMLFormElement>, kind: "create" | "attach" | "reject" | "correction") {
    event.preventDefault();
    if (!reviewReason.trim()) {
      setStatus("Review reason is required.");
      return;
    }
    if (kind === "attach" && !patientId.trim()) {
      setStatus("Existing patient ID is required for attach.");
      return;
    }
    setStatus("Saving");
    try {
      if (kind === "create") await createPatientFromSubmission(currentSubmission.id, reviewReason);
      if (kind === "attach") await attachSubmissionToPatient(currentSubmission.id, patientId, reviewReason);
      if (kind === "reject") await rejectExternalSubmission(currentSubmission.id, reviewReason);
      if (kind === "correction") await requestExternalIntakeCorrection(currentSubmission.id, reviewReason);
      await onChanged();
      setStatus("Saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not review submission.");
    }
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Submission detail</h2>
        <span className="badge">{currentSubmission.source}</span>
      </div>
      <dl className="metadata-grid">
        <div><dt>Submitted</dt><dd>{formatDate(currentSubmission.submittedAt ?? currentSubmission.receivedAt)}</dd></div>
        <div><dt>Suggested type</dt><dd>{String(caseType.patientType ?? "WOMEN_HEALTH")}</dd></div>
        <div><dt>Suggested phase</dt><dd>{String(caseType.suggestedPhase ?? "general_review")}</dd></div>
        <div><dt>Language</dt><dd>{currentSubmission.language}</dd></div>
      </dl>

      <div className="readable-answer-grid">
        {mappedFields.map(([key, label]) => (
          <div key={key}>
            <span>{label}</span>
            <strong>{String(mapped[key] ?? "Not provided")}</strong>
          </div>
        ))}
      </div>

      <div className="section-heading"><h3>Duplicate candidates</h3><span className="badge">{duplicates.length}</span></div>
      {duplicates.length === 0 ? <p className="muted">No exact normalized phone duplicate was found. Names, MRNs, and birth dates remain available for manual comparison.</p> : null}
      <div className="clinical-chip-row">
        {duplicates.map((candidate) => (
          <button className={`clinical-chip ${patientId === String(candidate.id) ? "active" : ""}`} key={String(candidate.id)} type="button" onClick={() => setPatientId(String(candidate.id))}>
            <strong>{String(candidate.name ?? "Patient")}</strong>
            <span>{String(candidate.mrn ?? "")} · {String(candidate.phone ?? "")} · {String(candidate.dateOfBirth ?? "DOB not recorded")}</span>
            <span>{String(candidate.branch ?? "Branch not recorded")} · last visit {formatDate(String(candidate.lastVisit ?? ""))}</span>
            <span>Match: {String(candidate.matchingReason ?? "review candidate")} · confidence {String(candidate.confidence ?? "review")}</span>
          </button>
        ))}
      </div>

      <form className="form-grid" onSubmit={(event) => void action(event, "create")}>
        <label className="wide">Review reason<input value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} placeholder="Reviewed by doctor/admin before creating patient" /></label>
        <button className="button" type="submit"><ThreeDMedicalIcon name="patients" size="sm" />Create new patient</button>
      </form>

      <form className="form-grid" onSubmit={(event) => void action(event, "attach")}>
        <div className="wide"><PatientPicker patients={[]} selectedPatientId={patientId} onSelect={setPatientId} onPatientSelect={(patient) => setPatientId(patient?.id ?? "")} required label="Find existing patient" storageKey="external-intake-patient" /></div>
        <button className="button secondary" type="submit" disabled={!patientId}>Attach selected patient</button>
        {patientId ? <Link className="button secondary" href={`/patients/${patientId}`}>Open selected patient</Link> : null}
      </form>

      <div className="form-actions">
        <form onSubmit={(event) => void action(event, "correction")}><button className="button secondary" type="submit">Request correction</button></form>
        <form onSubmit={(event) => void action(event, "reject")}><button className="button secondary danger-soft" type="submit">Reject submission</button></form>
      </div>
      {status ? <p className="muted">{status}</p> : null}
      <p className="form-warning">External text is untrusted and is not written to signed records, pregnancy episodes, investigations, or documents without review.</p>
    </section>
  );
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
