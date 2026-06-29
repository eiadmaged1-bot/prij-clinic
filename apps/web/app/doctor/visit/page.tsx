"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { AppShell, SafetyAlert } from "../../mvp-page";

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

export default function GuidedVisitPage() {
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState("");

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved("Draft saved in this demo screen. Use the patient file to create the final visit record.");
  }

  const current = steps[step]!;

  return (
    <AppShell>
      <section className="visit-shell">
        <div className="visit-header">
          <div>
            <p className="eyebrow">Guided Visit</p>
            <h1>{current[0]}</h1>
            <p className="muted">{current[1]}</p>
          </div>
          <Link className="button secondary" href="/doctor">
            <ThreeDMedicalIcon name="doctor" size="sm" tone="slate" />
            Back to Doctor Mode
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
          <label>
            {current[2]}
            <textarea placeholder="Write clear doctor-authored notes here. No AI text is inserted automatically." />
          </label>
          {step === 3 ? <p className="notice">This field is doctor-authored. The app does not diagnose automatically.</p> : null}
          {step === 4 ? <p className="notice">Prescription text must be written and reviewed by the doctor.</p> : null}
          {step === 7 ? <p className="notice">Finish only after manual review. Signed records stay protected.</p> : null}
          {saved ? <p className="notice success">{saved}</p> : null}
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
              <Link className="button" href="/patients">
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
