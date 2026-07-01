import { AppShell } from "../../mvp-page";
import { DrugMarketCoverageDashboard, DrugMarketImportPanel, ReviewQueuePanel, SourceAndCountrySummary } from "../../../components/medications/MedicationComponents";

export default function AdminDrugMarketPage() {
  return <AppShell><section className="page-header"><h1>Medication Reference Controls</h1><p className="muted">Official source imports, country badge settings, review queues, and variant verification.</p></section><SourceAndCountrySummary /><DrugMarketImportPanel /><ReviewQueuePanel /><DrugMarketCoverageDashboard /></AppShell>;
}
