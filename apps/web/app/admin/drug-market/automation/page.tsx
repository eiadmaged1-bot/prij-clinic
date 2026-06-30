import { AppShell } from "../../../mvp-page";
import { SourceConnectorPanel } from "../../../../components/medications/MedicationComponents";

export default function AdminDrugMarketAutomationPage() {
  return <AppShell><section className="page-header"><h1>Drug Market Automation</h1><p className="muted">Approved official connectors only. Retail metadata is disabled by default.</p></section><SourceConnectorPanel /></AppShell>;
}
