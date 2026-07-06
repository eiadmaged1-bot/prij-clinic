"use client";

import Link from "next/link";
import { AppShell } from "../mvp-page";

export default function EncountersPage() {
  return (
    <AppShell>
      <section className="page-header">
        <div>
          <p className="eyebrow">Clinical records</p>
          <h1>Encounters</h1>
        </div>
      </section>
      <section className="content-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <h2>Patient-context visit note</h2>
              <p className="muted">Select a patient or open from patient file.</p>
            </div>
            <span className="badge">Doctor draft</span>
          </div>
          <div className="form-grid">
            <label>Chief complaint<textarea disabled placeholder="Open a patient visit to record the chief complaint." /></label>
            <label>History<textarea disabled placeholder="Patient context is required before editing." /></label>
            <label>Examination<textarea disabled placeholder="Patient context is required before editing." /></label>
            <label>Assessment / opinion<textarea disabled placeholder="Doctor-authored draft only." /></label>
            <label>Plan<textarea disabled placeholder="Plan, follow-up, requests, and prescriptions stay linked to the visit." /></label>
          </div>
          <div className="form-actions">
            <button className="button secondary" disabled type="button">Save draft</button>
            <button className="button" disabled type="button">Complete visit</button>
            <Link className="button secondary" href="/patients">Select patient</Link>
          </div>
        </article>
        <article className="panel">
          <h2>Doctor signature</h2>
          <p className="muted">Doctor signature is assigned only when the doctor starts or signs the visit. Receptionist check-in signature remains operational and separate.</p>
        </article>
      </section>
    </AppShell>
  );
}
