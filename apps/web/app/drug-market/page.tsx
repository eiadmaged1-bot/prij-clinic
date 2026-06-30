import { AppShell } from "../mvp-page";
import { DrugMarketSearchBox, SourceAndCountrySummary } from "../../components/medications/MedicationComponents";

export default function DrugMarketPage() {
  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Egypt and Gulf market catalog</p>
        <h1>Drug Market</h1>
        <p className="muted">Marketed strength, form, and pack variants only. Retail workflows are outside this clinical reference.</p>
      </section>
      <DrugMarketSearchBox />
      <SourceAndCountrySummary />
    </AppShell>
  );
}
