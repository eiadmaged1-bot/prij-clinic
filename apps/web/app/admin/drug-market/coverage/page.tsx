import { AppShell } from "../../../mvp-page";
import { DrugMarketCoverageDashboard } from "../../../../components/medications/MedicationComponents";

export default function AdminDrugMarketCoveragePage() {
  return (
    <AppShell>
      <section className="page-header">
        <h1>Medication Reference Coverage</h1>
        <p className="muted">Country and review-status coverage for official-source-first medication metadata.</p>
      </section>
      <DrugMarketCoverageDashboard />
    </AppShell>
  );
}
