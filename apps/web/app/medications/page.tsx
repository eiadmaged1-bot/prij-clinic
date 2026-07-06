import { AppShell } from "../mvp-page";
import { DrugFamilyBrowser, MedicationProfileCard, MedicationSafetyPanel, MedicationSearchBox, PatientAllergyList, PatientMedicationList } from "../../components/medications/MedicationComponents";

export default function MedicationCenterPage() {
  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Pharmacology</p>
        <h1>Pharmacology / Medication Reference</h1>
        <p className="muted">Generic, brand, class, and function search. Prescription workflow prefers generic names. Doctor review required.</p>
      </section>
      <section className="visit-type-counts" aria-label="Pharmacology quick filters">
        {["Pain killers", "Antibiotics", "Antiemetics", "Antihypertensives", "Contraception", "Progesterone/Fertility", "Diabetes", "Thyroid"].map((label) => <button key={label} type="button">{label}</button>)}
      </section>
      <section className="visit-type-counts" aria-label="Country filters">
        <span>Bahrain</span>
        <span>Oman</span>
        <span>Libya future/imported only</span>
      </section>
      <MedicationSearchBox />
      <section className="compact-metric-grid">
        <article className="mini-metric-card"><span>Official rows</span><strong>Source tracked</strong></article>
        <article className="mini-metric-card"><span>Verified rows</span><strong>Doctor review</strong></article>
        <article className="mini-metric-card"><span>Needs review</span><strong>Import queue</strong></article>
        <article className="mini-metric-card"><span>Source registry</span><strong>BHR / OMN / LBY</strong></article>
      </section>
      <div className="content-grid">
        <DrugFamilyBrowser />
        <MedicationProfileCard />
        <PatientMedicationList />
        <PatientAllergyList />
      </div>
      <section className="panel compact-panel">
        <h2>Drug interaction safety foundation</h2>
        <p className="muted">No verified interaction records loaded for this pair. Doctor review required. Warnings are assistive and source-aware: Major / Moderate / Minor / Unknown with reason and citation when present.</p>
      </section>
      <MedicationSafetyPanel />
    </AppShell>
  );
}
