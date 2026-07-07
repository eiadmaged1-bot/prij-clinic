"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { AppShell } from "../mvp-page";
import { ClinicalTagPatient, listClinicalTagDefinitions, searchClinicalTagPatients } from "@/lib/clinical-tags";

const quickTags = [
  ["previous_cesarean_section", "Previous CS"],
  ["dilation_and_curettage", "D&C"],
  ["mastectomy", "Mastectomy"],
  ["icsi", "ICSI"],
  ["iui", "IUI"],
  ["ovulation_induction", "Ovulation induction"],
  ["recurrent_abortion", "Recurrent abortion"],
  ["pcos", "PCOS"],
  ["endometriosis", "Endometriosis"],
  ["diabetes", "Diabetes"],
  ["hypertension", "Hypertension"]
] as const;

export default function ClinicalTagsPage() {
  const [query, setQuery] = useState("previous_cesarean_section");
  const [patients, setPatients] = useState<ClinicalTagPatient[]>([]);
  const [status, setStatus] = useState("Loading");

  async function runSearch(next = query) {
    setStatus("Searching");
    try {
      const result = await searchClinicalTagPatients(next);
      setPatients(result.patients);
      setStatus("Ready");
    } catch (error) {
      setPatients([]);
      setStatus(error instanceof Error ? error.message : "Could not search clinical tags.");
    }
  }

  useEffect(() => {
    void listClinicalTagDefinitions().catch(() => undefined);
    void runSearch("previous_cesarean_section");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Clinical Tag Search</p>
            <h1>Smart Clinical Search</h1>
            <p className="muted">Owner/Admin/Doctor cohort search by reviewed clinical tags. Search is audited.</p>
          </div>
        </div>
      </section>

      <section className="panel compact-panel">
        <div className="section-heading"><h2>Quick tags</h2><span className="badge">{status}</span></div>
        <div className="clinical-chip-row">
          {quickTags.map(([code, label]) => (
            <button className={`clinical-chip ${query === code ? "active" : ""}`} key={code} type="button" onClick={() => { setQuery(code); void runSearch(code); }}>
              <strong>{label}</strong>
              <span>{code}</span>
            </button>
          ))}
        </div>
        <form className="form-grid" onSubmit={(event) => { event.preventDefault(); void runSearch(); }}>
          <label className="wide">Search tag or alias<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="D&C, mastectomy, ICSI" /></label>
          <button className="button" type="submit"><ThreeDMedicalIcon name="search" size="sm" />Search</button>
        </form>
      </section>

      <section className="panel">
        <div className="section-heading"><h2>Matching patients</h2><span className="badge">{patients.length}</span></div>
        {patients.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="patients" size="sm" tone="slate" /><span>No patients found for this tag.</span></p> : null}
        <div className="data-list">
          {patients.map((row) => (
            <article className="data-row" key={row.id}>
              <div className="data-row-header">
                <strong>{row.patientName || "Patient"} · {row.medicalRecordNumber}</strong>
                <span className="badge">{row.tagLabel}</span>
              </div>
              <p className="muted">{[row.patientType, row.currentPhase?.phaseType, row.tagCategory, row.sourceType, row.tagDate?.slice(0, 10)].filter(Boolean).join(" | ")}</p>
              <div className="form-actions">
                <Link className="button secondary compact" href={`/patients/${row.patientId}`}>Open patient file</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
