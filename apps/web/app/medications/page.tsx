import { AppShell } from "../mvp-page";
import { DrugFamilyBrowser, MedicationProfileCard, MedicationSafetyPanel, MedicationSearchBox, PatientAllergyList, PatientMedicationList } from "../../components/medications/MedicationComponents";

export default function MedicationCenterPage() {
  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Official medication reference</p>
        <h1>Medication Reference</h1>
        <p className="muted">Bahrain and Oman official reference metadata, search, patient medication lists, allergies, and doctor-reviewed safety support.</p>
      </section>
      <section className="summary-grid">
        <article className="metric-card">
          <span>Official rows</span>
          <strong>8,269</strong>
          <p className="muted">BHR + OMN data available</p>
        </article>
        <article className="metric-card">
          <span>Verified</span>
          <strong>1,200</strong>
          <p className="muted">High-confidence reviewed rows</p>
        </article>
        <article className="metric-card">
          <span>Needs review</span>
          <strong>7,069</strong>
          <p className="muted">Owner review queue remains open</p>
        </article>
        <article className="metric-card">
          <span>Safety boundary</span>
          <strong>Reference</strong>
          <p className="muted">No auto-prescribing or patient use instructions</p>
        </article>
      </section>
      <MedicationSearchBox />
      <div className="content-grid">
        <DrugFamilyBrowser />
        <MedicationProfileCard />
        <PatientMedicationList />
        <PatientAllergyList />
      </div>
      <MedicationSafetyPanel />
    </AppShell>
  );
}
