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
      <section className="summary-grid">
        <article className="metric-card"><span>Total official rows</span><strong>8,269</strong><p className="muted">BHR + OMN available</p></article>
        <article className="metric-card"><span>Verified rows</span><strong>1,200</strong><p className="muted">600 Bahrain, 600 Oman</p></article>
        <article className="metric-card"><span>Review queue</span><strong>7,069</strong><p className="muted">Open items remain owner-reviewed</p></article>
        <article className="metric-card"><span>Source freshness</span><strong>Current</strong><p className="muted">Latest local source checks recorded</p></article>
      </section>
      <DrugMarketSearchBox />
      <SourceAndCountrySummary />
    </AppShell>
  );
}
