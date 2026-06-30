import { AppShell } from "../../../mvp-page";
import { DrugMarketImportPanel, SourceConnectorPanel } from "../../../../components/medications/MedicationComponents";

export default function AdminDrugMarketImportPage() {
  return (
    <AppShell>
      <section className="page-header">
        <h1>Official Medication Import</h1>
        <p className="muted">Upload official or licensed medication source files, dry run mappings, and route uncertain rows to review.</p>
      </section>
      <DrugMarketImportPanel />
      <SourceConnectorPanel />
    </AppShell>
  );
}
