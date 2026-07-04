"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { AppShell, SafetyAlert } from "../../mvp-page";

import { getApiBaseUrl } from "@/lib/api-base-url";
import { autosaveLabel, saveLocalDraft, useAutosaveDraft } from "@/lib/autosave-draft";

const steps = [
  ["Complaint", "What brought the patient today?", "Chief complaint"],
  ["History", "Relevant history in the doctor's words.", "History"],
  ["Examination", "Clinical examination notes.", "Examination"],
  ["Impression", "Doctor-written impression or diagnosis text.", "Impression / diagnosis text"],
  ["Prescription", "Manual prescription plan. No automatic prescribing.", "Prescription plan"],
  ["Orders", "Lab or radiology orders to request.", "Orders"],
  ["Follow-up", "Plan and next follow-up.", "Follow-up"],
  ["Finish Visit", "Review, save, then finish when ready.", "Final review"]
] as const;

const complaintCards = [
  "AUB",
  "Pelvic pain",
  "Dysmenorrhea",
  "Dyspareunia",
  "Vaginal discharge",
  "UTI symptoms",
  "Infertility",
  "Amenorrhea",
  "Heavy menstrual bleeding",
  "Postmenopausal bleeding",
  "Pregnancy follow-up",
  "Bleeding in pregnancy",
  "Reduced fetal movement",
  "Routine follow-up"
];

export default function GuidedVisitPage() {
  return (
    <Suspense fallback={<GuidedVisitFallback />}>
      <GuidedVisitContent />
    </Suspense>
  );
}

function GuidedVisitFallback() {
  return (
    <AppShell>
      <section className="visit-shell">
        <div className="visit-header">
          <div>
            <p className="eyebrow">Guided Visit</p>
            <h1>Preparing visit</h1>
            <p className="muted">Open the patient, write doctor-authored notes, then save the visit draft.</p>
          </div>
          <Link className="button secondary" href="/doctor">
            <ThreeDMedicalIcon name="doctor" size="sm" tone="slate" />
            Back to Doctor Mode
          </Link>
        </div>
        <div className="visit-card">
          <div className="skeleton" />
          <div className="visit-actions">
            <button className="button secondary" disabled type="button">
              <ThreeDMedicalIcon name="files" size="sm" tone="slate" />
              Save Draft
            </button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function GuidedVisitContent() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [encounterId, setEncounterId] = useState("");
  const [patientName, setPatientName] = useState("Selected patient");
  const [formState, setFormState] = useState({
    chiefComplaint: "",
    historyText: "",
    examText: "",
    assessmentText: "",
    prescriptionPlan: "",
    ordersPlan: "",
    planText: ""
  });

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("prijClinicToken");
  }, []);
  const autosave = useAutosaveDraft({
    key: `doctor-visit:${patientId ?? "unassigned"}`,
    entityType: "doctor_visit_draft",
    patientId,
    payload: formState,
    enabled: Boolean(patientId),
    debounceMs: 400
  });

  useEffect(() => {
    if (!patientId) return;
    fetch(`${getApiBaseUrl()}/patients/${patientId}`, {
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    })
      .then(async (response) => {
        if (!response.ok) return;
        const patient = await response.json() as { firstName?: string; lastName?: string };
        setPatientName(`${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim() || "Selected patient");
      })
      .catch(() => undefined);
  }, [patientId, token]);

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!patientId) {
      setError("Open a patient file first, then start the guided visit.");
      return;
    }

    const payload = {
      chiefComplaint: formState.chiefComplaint,
      historyText: formState.historyText,
      examText: formState.examText,
      assessmentText: formState.assessmentText,
      planText: [formState.planText, formState.prescriptionPlan ? `Prescription plan: ${formState.prescriptionPlan}` : "", formState.ordersPlan ? `Orders: ${formState.ordersPlan}` : ""]
        .filter(Boolean)
        .join("\n")
    };

    const response = await fetch(`${getApiBaseUrl()}${encounterId ? `/encounters/${encounterId}` : `/patients/${patientId}/encounters`}`, {
      method: encounterId ? "PATCH" : "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    }).catch(() => null);

    if (!response || !response.ok) {
      setError("Could not save the visit draft. Check your role and try again.");
      return;
    }

    const encounter = await response.json() as { id?: string };
    if (encounter.id) setEncounterId(encounter.id);
    setSaved("Visit draft saved to the patient file.");
  }

  const current = steps[step]!;

  function addComplaint(label: string) {
    let nextState = formState;
    setFormState((currentState) => {
      const existing = currentState.chiefComplaint.trim();
      nextState = { ...currentState, chiefComplaint: existing ? `${existing}; ${label}` : label };
      return nextState;
    });
    if (patientId) {
      void saveLocalDraft({
        key: `doctor-visit:${patientId}`,
        entityType: "doctor_visit_draft",
        patientId,
        payload: nextState,
        updatedAt: new Date().toISOString()
      });
    }
    setStep(0);
    setSaved("Complaint added to draft. Save when ready.");
  }

  return (
    <AppShell>
      <section className="visit-shell">
        <div className="visit-header">
          <div>
            <p className="eyebrow">Guided Visit</p>
            <h1>{current[0]}</h1>
            <p className="muted">{patientId ? `${patientName} - ${current[1]}` : current[1]}</p>
          </div>
          <span className="badge accent">{autosaveLabel(autosave.state)}</span>
          <Link className="button secondary" href={patientId ? `/patients/${patientId}` : "/doctor"}>
            <ThreeDMedicalIcon name="doctor" size="sm" tone="slate" />
            {patientId ? "Back to patient file" : "Back to Doctor Mode"}
          </Link>
        </div>

        <SafetyAlert />

        <section className="visit-progress" aria-label="Visit steps">
          {steps.map(([label], index) => (
            <button className={index === step ? "active" : ""} key={label} onClick={() => setStep(index)} type="button">
              <ThreeDMedicalIcon name={index < 4 ? "encounter" : index === 4 ? "prescription" : index === 5 ? "investigations" : "timeline"} size="sm" />
              <span>{label}</span>
            </button>
          ))}
        </section>

        <form className="visit-card" onSubmit={saveDraft}>
          {step === 0 ? (
            <div className="obgyn-template-grid">
              {complaintCards.map((label) => (
                <button className="obgyn-template-card" key={label} type="button" onClick={() => addComplaint(label)}>
                  <ThreeDMedicalIcon name={label.includes("pregnancy") || label.includes("fetal") ? "pregnancy" : "encounter"} size="sm" />
                  <strong>{label}</strong>
                  <p className="muted">Add to draft complaint</p>
                </button>
              ))}
            </div>
          ) : null}
          <label>
            {current[2]}
            <textarea
              onChange={(event) => setFormState((currentState) => ({ ...currentState, [fieldForStep(step)]: event.target.value }))}
              placeholder="Write clear doctor-authored notes here. No AI text is inserted automatically."
              value={formState[fieldForStep(step)]}
            />
          </label>
          {step === 3 ? <p className="notice">This field is doctor-authored. The app does not diagnose automatically.</p> : null}
          {step === 4 ? <p className="notice">Prescription text must be written and reviewed by the doctor.</p> : null}
          {step === 7 ? <p className="notice">Finish only after manual review. Signed records stay protected.</p> : null}
          {saved ? <p className="notice success">{saved}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <div className="visit-actions">
            <button className="button secondary" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} type="button">
              <ThreeDMedicalIcon name="timeline" size="sm" tone="slate" />
              Previous
            </button>
            <button className="button secondary" type="submit">
              <ThreeDMedicalIcon name="files" size="sm" tone="slate" />
              Save Draft
            </button>
            {step < steps.length - 1 ? (
              <button className="button" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} type="button">
                <ThreeDMedicalIcon name="timeline" size="sm" />
                Next
              </button>
            ) : (
              <Link className="button" href={patientId ? `/patients/${patientId}` : "/patients"}>
                <ThreeDMedicalIcon name="patients" size="sm" />
                Finish Visit
              </Link>
            )}
          </div>
        </form>
      </section>
    </AppShell>
  );
}

type VisitField = "chiefComplaint" | "historyText" | "examText" | "assessmentText" | "prescriptionPlan" | "ordersPlan" | "planText";

function fieldForStep(step: number): VisitField {
  if (step === 0) return "chiefComplaint";
  if (step === 1) return "historyText";
  if (step === 2) return "examText";
  if (step === 3) return "assessmentText";
  if (step === 4) return "prescriptionPlan";
  if (step === 5) return "ordersPlan";
  return "planText";
}
