import { AppShell } from "../../mvp-page";
import { DrugFamilyBrowser, MedicationProfileCard, ReviewQueuePanel } from "../../../components/medications/MedicationComponents";

export default function AdminMedicationsPage() {
  return <AppShell><section className="page-header"><h1>Medication Catalog Controls</h1><p className="muted">Catalog management, label sections, interactions, verification, and herbal references for authorized admins.</p></section><DrugFamilyBrowser /><MedicationProfileCard /><ReviewQueuePanel /></AppShell>;
}
