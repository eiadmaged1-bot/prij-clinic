"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../mvp-page";
import { DrugFamilyBrowser, MedicationProfileCard, MedicationSafetyPanel, MedicationSearchBox } from "../../components/medications/MedicationComponents";
import type { MedicationResult } from "../../lib/medications";

export default function MedicationCenterPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MedicationResult | null>(null);
  const [patientId, setPatientId] = useState("");
  const [encounterId, setEncounterId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") ?? "");
    setPatientId(params.get("patientId") ?? "");
    setEncounterId(params.get("visitId") ?? params.get("encounterId") ?? "");
  }, []);

  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Medication & Prescription Assistant</p>
        <h1>Search & Prescribe</h1>
        <p className="muted">Search generic, brand, class, or function terms. Doctor writes dose, timing, duration, and instructions manually.</p>
      </section>
      <section className="patient-tabs simple" aria-label="Medication assistant tabs">
        {["Search & Prescribe", "Patient Safety", "Favorites"].map((label, index) => <button className={`tab-button ${index === 0 ? "active" : ""}`} key={label} type="button">{label}</button>)}
      </section>
      <section className="visit-type-counts" aria-label="Common OB/GYN medication searches">
        {["painkiller", "antibiotic", "antiemetic", "nausea", "thyroid", "iron", "progesterone", "vaginal infection"].map((label) => <button className={query === label ? "active" : ""} key={label} type="button" onClick={() => setQuery(label)}>{label}</button>)}
      </section>
      <div className="content-grid two-columns medication-reference-layout">
        <div><MedicationSearchBox queryValue={query} onQueryChange={setQuery} onSelect={setSelected} onAddToPrescription={(medication) => {
          const params = new URLSearchParams();
          if (patientId) params.set("patientId", patientId);
          if (encounterId) params.set("encounterId", encounterId);
          params.set("medication", medication.genericName || medication.tradeName || "");
          window.location.assign(`/prescriptions?${params.toString()}`);
        }} /><DrugFamilyBrowser onChoose={setQuery} /></div>
        <MedicationProfileCard medication={selected} />
      </div>
      <section className="panel compact-panel">
        <h2>Drug interaction safety foundation</h2>
        <p className="muted">No verified interaction records loaded for this pair. Doctor review required. Warnings are assistive and source-aware: Major / Moderate / Minor / Unknown with reason and citation when present.</p>
      </section>
      <MedicationSafetyPanel patientId={patientId || undefined} medication={selected} />
    </AppShell>
  );
}
