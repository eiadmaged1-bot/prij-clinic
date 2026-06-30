import { AppShell } from "../mvp-page";
import { DrugFamilyBrowser, MedicationProfileCard, MedicationSafetyPanel, MedicationSearchBox, PatientAllergyList, PatientMedicationList } from "../../components/medications/MedicationComponents";

export default function MedicationCenterPage() {
  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Medication Intelligence Engine</p>
        <h1>Medication Center</h1>
        <p className="muted">Professional medication reference and safety support for clinicians. No autonomous prescribing and no patient self-medication guidance.</p>
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
