import { AppShell } from "../mvp-page";
import { DrugMarketSearchBox, SourceAndCountrySummary } from "../../components/medications/MedicationComponents";

export default function DrugMarketPage() {
  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Official source metadata</p>
        <h1>Official Medicine Data</h1>
        <p className="muted">Bahrain and Oman source-labeled medication metadata for clinician reference. Market strength, form, and pack are not patient instructions.</p>
      </section>
      <section className="compact-metric-grid">
        <article className="mini-metric-card"><span>Official rows</span><strong>8,269</strong><p className="muted">BHR + OMN metadata</p></article>
        <article className="mini-metric-card"><span>Source verified</span><strong>1,200</strong><p className="muted">Official source checked</p></article>
        <article className="mini-metric-card"><span>Clinical review required</span><strong>7,069</strong><p className="muted">Not safety-verified</p></article>
        <article className="mini-metric-card"><span>Source freshness</span><strong>Current</strong><p className="muted">Local source checks</p></article>
      </section>
      <DrugMarketSearchBox />
      <SourceAndCountrySummary />
    </AppShell>
  );
}
