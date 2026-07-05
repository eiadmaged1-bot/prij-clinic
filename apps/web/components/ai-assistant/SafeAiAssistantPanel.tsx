"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThreeDMedicalIcon } from "../ThreeDMedicalIcon";
import {
  generatePatientAiDraft,
  getAiSafetyStatus,
  getPatientAiAssistant,
  reviewAiDraft,
  searchPatientAiFile,
  type AiAssistantState,
  type AiDraft,
  type AiSafetyStatus,
  type AiSearchResult
} from "@/lib/ai-assistant";
import { workflowRequest } from "@/lib/workflow-api";

type PatientOption = {
  id: string;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
};

export function SafeAiAssistantPanel({ patientId: fixedPatientId }: { patientId?: string }) {
  const [patientId, setPatientId] = useState(fixedPatientId ?? "");
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [assistant, setAssistant] = useState<AiAssistantState | null>(null);
  const [safety, setSafety] = useState<AiSafetyStatus | null>(null);
  const [drafts, setDrafts] = useState<AiDraft[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AiSearchResult[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    void getAiSafetyStatus().then(setSafety).catch(() => setStatus("AI assistant unavailable"));
    if (!fixedPatientId) {
      void workflowRequest<{ patients?: PatientOption[] }>("/patients")
        .then((data) => {
          setPatients(data.patients ?? []);
          if (!patientId && data.patients?.[0]) setPatientId(data.patients[0].id);
        })
        .catch(() => setPatients([]));
    }
  }, [fixedPatientId, patientId]);

  useEffect(() => {
    if (!patientId) return;
    void loadAssistant(patientId);
  }, [patientId]);

  async function loadAssistant(nextPatientId = patientId) {
    setStatus("Loading");
    try {
      const data = await getPatientAiAssistant(nextPatientId);
      setAssistant(data);
      setStatus("Ready");
    } catch {
      setAssistant(null);
      setStatus("Your role cannot open clinical AI tools.");
    }
  }

  async function generate(kind: string) {
    if (!patientId) return;
    setStatus("Generating draft");
    try {
      const draft = await generatePatientAiDraft(patientId, kind);
      setDrafts((current) => [draft, ...current]);
      setStatus("Draft generated for doctor review");
    } catch {
      setStatus("Could not generate this draft for your role.");
    }
  }

  async function review(draft: AiDraft, nextStatus: "approved" | "rejected") {
    if (nextStatus === "rejected" && !rejectionReason.trim()) {
      setStatus("Rejection reason is required.");
      return;
    }
    setStatus("Saving review");
    try {
      const updated = await reviewAiDraft(draft.id, nextStatus, nextStatus === "rejected" ? rejectionReason : "Doctor reviewed draft.");
      setDrafts((current) => current.map((item) => item.id === updated.id ? updated : item));
      setStatus(nextStatus === "approved" ? "Draft approved only; no final record was changed" : "Draft rejected");
    } catch {
      setStatus("Could not save the draft review.");
    }
  }

  async function search() {
    if (!patientId || !searchQuery.trim()) return;
    setStatus("Searching patient file");
    try {
      const data = await searchPatientAiFile(patientId, searchQuery);
      setSearchResults(data.results);
      setStatus("Patient-scoped search complete");
    } catch {
      setStatus("Could not search this patient file.");
    }
  }

  const availableDrafts = assistant?.availableDrafts ?? [
    { kind: "patient_history_summary", label: "Patient history summary draft" },
    { kind: "visit_note_summary", label: "Visit note summary draft" },
    { kind: "follow_up_reminder", label: "Follow-up reminder draft" }
  ];
  const checklist = assistant?.missingFieldChecklist ?? [];

  return (
    <section className="ai-assistant-workspace">
      <div className="section-heading">
        <div>
          <h2>Safe AI Assistant</h2>
          <p className="muted">Draft - doctor review required. External AI is disabled.</p>
        </div>
        <span className="badge warning">Assistive only</span>
      </div>

      {!fixedPatientId ? (
        <label>
          Patient file
          <select value={patientId} onChange={(event) => setPatientId(event.target.value)}>
            <option value="">Select patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.firstName} {patient.lastName} - {patient.medicalRecordNumber}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="compact-metric-grid">
        <Metric label="AI safety status" value={safety?.externalAiEnabled ? "External enabled" : "External disabled"} />
        <Metric label="Clinical mode" value={safety?.clinicalOutputMode?.replaceAll("_", " ") ?? "draft only"} />
        <Metric label="Doctor review" value={safety?.doctorReviewRequired ? "Required" : "Missing"} />
        <Metric label="Status" value={status} />
      </div>

      <div className="content-grid">
        <article className="panel compact-panel">
          <div className="section-heading">
            <h3>Draft generators</h3>
            <span className="badge">No diagnosis</span>
          </div>
          <div className="dense-card-list">
            {availableDrafts.map((draft) => (
              <button className="picker-row" disabled={!patientId} key={draft.kind} type="button" onClick={() => generate(draft.kind)}>
                <strong>{draft.label}</strong>
                <span>Uses stored patient data only.</span>
              </button>
            ))}
          </div>
        </article>

        <article className="panel compact-panel">
          <div className="section-heading">
            <h3>Missing field checklist</h3>
            <span className="badge">Checklist only</span>
          </div>
          <div className="data-list">
            {checklist.map((item) => (
              <div className="data-row dense" key={item.key}>
                <div className="data-row-header"><strong>{item.label}</strong><span className="badge">{item.status}</span></div>
                <p className="muted">{item.note}</p>
              </div>
            ))}
            {checklist.length === 0 ? <p className="empty-state">Select a patient file to load the deterministic checklist.</p> : null}
          </div>
        </article>
      </div>

      <article className="panel compact-panel">
        <div className="section-heading">
          <h3>Patient-file search helper</h3>
          <span className="badge">Patient scoped</span>
        </div>
        <div className="search-row">
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search timeline, visits, orders, documents, pregnancy, gynecology" />
          <button className="button secondary compact" disabled={!patientId || !searchQuery.trim()} onClick={search} type="button">
            <ThreeDMedicalIcon name="search" size="sm" tone="slate" />
            Search
          </button>
        </div>
        <div className="data-list">
          {searchResults.map((result, index) => (
            <article className="data-row dense" key={`${result.section}-${result.label}-${index}`}>
              <div className="data-row-header"><strong>{result.section}: {result.label}</strong><span className="badge">{result.status ?? "record"}</span></div>
              <p className="muted">{result.summary}</p>
            </article>
          ))}
        </div>
      </article>

      <article className="panel compact-panel">
        <div className="section-heading">
          <h3>Doctor approval workflow</h3>
          <span className="badge danger">No automatic final save</span>
        </div>
        <label>Rejection reason<input value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Required when rejecting a draft" /></label>
        <div className="data-list">
          {drafts.map((draft) => (
            <article className="data-row" key={draft.id}>
              <div className="data-row-header"><strong>{draft.draftType.replaceAll("_", " ")}</strong><span className="badge">{draft.status.replaceAll("_", " ")}</span></div>
              <pre className="draft-preview">{draft.generatedText}</pre>
              <p className="muted">{draft.inputSourceSummary}</p>
              <div className="topbar-actions">
                <button className="button secondary compact" type="button" onClick={() => review(draft, "rejected")}>Reject</button>
                <button className="button compact" type="button" onClick={() => review(draft, "approved")}>Approve draft only</button>
              </div>
            </article>
          ))}
          {drafts.length === 0 ? <p className="empty-state">Generated drafts appear here for doctor review. Nothing is copied into the patient record automatically.</p> : null}
        </div>
      </article>

      <p className="muted">
        Prompt-injection protection: document text, OCR, patient-entered content, and copied text are treated as untrusted content, not instructions. System and provider configuration are not shown here.
      </p>
      {!fixedPatientId ? <Link className="button secondary compact" href="/ai-drafts">Open draft review list</Link> : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <article className="mini-metric-card"><span>{label}</span><strong>{value}</strong></article>;
}
