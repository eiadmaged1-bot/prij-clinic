import { AppShell } from "../mvp-page";
import { MedicationProfileCard, MedicationSafetyPanel, MedicationSearchBox } from "../../components/medications/MedicationComponents";

export default function MedicationCenterPage() {
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
        {["painkiller", "antibiotic", "antiemetic", "nausea", "thyroid", "iron", "progesterone", "vaginal infection"].map((label) => <button key={label} type="button">{label}</button>)}
      </section>
      <MedicationSearchBox />
      <div className="content-grid">
        <MedicationProfileCard />
      </div>
      <section className="panel compact-panel">
        <h2>Drug interaction safety foundation</h2>
        <p className="muted">No verified interaction records loaded for this pair. Doctor review required. Warnings are assistive and source-aware: Major / Moderate / Minor / Unknown with reason and citation when present.</p>
      </section>
      <MedicationSafetyPanel />
    </AppShell>
  );
}
