"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { AppShell } from "../mvp-page";
import { attachSubmissionToPatient, createPatientFromSubmission, ExternalIntakeSubmission, listExternalIntake, rejectExternalSubmission, requestExternalIntakeCorrection } from "@/lib/external-intake";

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
  const [submissions, setSubmissions] = useState<ExternalIntakeSubmission[]>([]);
  const [status, setStatus] = useState("Loading");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = submissions.find((submission) => submission.id === selectedId) ?? submissions[0] ?? null;

  async function load() {
    setStatus("Loading");
    try {
      const result = await listExternalIntake();
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
  }, []);

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">External Intake Inbox</p>
            <h1>Patient Submissions Review</h1>
            <p className="muted">Google Form submissions stay pending until Owner/Admin/Doctor review.</p>
          </div>
          <button className="button secondary compact" type="button" onClick={() => void load()}>
            <ThreeDMedicalIcon name="search" size="sm" tone="slate" />Refresh
          </button>
        </div>
      </section>

      <section className="content-grid intake-review-grid">
        <div className="panel compact-panel">
          <div className="section-heading"><h2>Pending submissions</h2><span className="badge">{status}</span></div>
          {submissions.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="files" size="sm" tone="slate" /><span>No pending external submissions.</span></p> : null}
          <div className="data-list">
            {submissions.map((submission) => {
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
      </section>
    </AppShell>
  );
}

function SubmissionDetail({ submission, onChanged }: { submission: ExternalIntakeSubmission | null; onChanged(): Promise<void> }) {
  const [reviewReason, setReviewReason] = useState("");
  const [patientId, setPatientId] = useState("");
  const [createInitialPhase, setCreateInitialPhase] = useState(true);
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
      if (kind === "create") await createPatientFromSubmission(currentSubmission.id, reviewReason, createInitialPhase);
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
      {duplicates.length === 0 ? <p className="muted">No duplicate candidates found by phone, name, or date of birth.</p> : null}
      <div className="clinical-chip-row">
        {duplicates.map((candidate) => (
          <Link className="clinical-chip" key={String(candidate.id)} href={`/patients/${String(candidate.id)}`}>
            <strong>{String(candidate.name ?? "Patient")}</strong>
            <span>{String(candidate.mrn ?? "")} {String(candidate.phone ?? "")}</span>
          </Link>
        ))}
      </div>

      <form className="form-grid" onSubmit={(event) => void action(event, "create")}>
        <label className="wide">Review reason<input value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} placeholder="Reviewed by doctor/admin before creating patient" /></label>
        <label className="checkbox-row"><input checked={createInitialPhase} onChange={(event) => setCreateInitialPhase(event.target.checked)} type="checkbox" /> Create suggested initial clinical phase</label>
        <button className="button" type="submit"><ThreeDMedicalIcon name="patients" size="sm" />Create new patient</button>
      </form>

      <form className="form-grid" onSubmit={(event) => void action(event, "attach")}>
        <label>Existing patient ID<input value={patientId} onChange={(event) => setPatientId(event.target.value)} placeholder="Paste reviewed patient ID" /></label>
        <button className="button secondary" type="submit">Attach to existing patient</button>
      </form>

      <div className="form-actions">
        <form onSubmit={(event) => void action(event, "correction")}><button className="button secondary" type="submit">Request correction</button></form>
        <form onSubmit={(event) => void action(event, "reject")}><button className="button secondary danger-soft" type="submit">Reject/archive with reason</button></form>
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
