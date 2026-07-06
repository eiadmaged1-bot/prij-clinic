"use client";

import Link from "next/link";
import { AppShell } from "../mvp-page";

const scanTypes = ["Dating", "Anomaly", "Growth", "Doppler", "Follow-up"];

export default function ObUltrasoundsPage() {
  return (
    <AppShell>
      <section className="page-header">
        <div>
          <p className="eyebrow">OB ultrasound</p>
          <h1>OB Ultrasounds</h1>
        </div>
      </section>
      <section className="content-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <h2>New scan from patient context</h2>
              <p className="muted">Select a patient or open from patient file.</p>
            </div>
            <span className="badge">Recording only</span>
          </div>
          <div className="visit-type-counts">
            {scanTypes.map((type) => <span key={type}>{type}</span>)}
          </div>
          <div className="form-grid">
            <label>GA<input disabled placeholder="Auto-fills from pregnancy context when available" /></label>
            <label>Fetus / baby<select disabled><option>Baby A / Baby B for twins when pregnancy context exists</option></select></label>
            <label>Scan note<textarea disabled placeholder="No automatic diagnosis, anomaly, FGR, or treatment label." /></label>
          </div>
          <Link className="button secondary" href="/patients">Select patient</Link>
        </article>
        <article className="panel">
          <h2>Records</h2>
          <div className="data-list">
            <article className="data-row">
              <div className="data-row-header"><strong>Patient - Date - GA</strong><span className="badge">Status</span></div>
              <p className="muted">Scan type, fetus/baby, and open action appear here after a patient-context scan exists.</p>
            </article>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
