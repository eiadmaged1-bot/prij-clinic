import { MedicationSafetyProfileSearch } from "../../../components/care-assist/MedicationSafetyProfileSearch";
import { AppShell } from "../../mvp-page";

export default function AdminMedicationSafetyProfilesPage() {
  return (
    <AppShell>
      <section className="page-header">
        <h1>Medication Safety Profiles</h1>
        <p className="muted">Pregnancy/lactation source and review metadata. Doctor review required.</p>
      </section>
      <MedicationSafetyProfileSearch />
    </AppShell>
  );
}
