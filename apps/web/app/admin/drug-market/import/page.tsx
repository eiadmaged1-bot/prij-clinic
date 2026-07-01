import { AppShell } from "../../../mvp-page";
import { SourceConnectorPanel } from "../../../../components/medications/MedicationComponents";

export default function AdminDrugMarketImportPage() {
  return (
    <AppShell>
      <section className="page-header">
        <h1>Official Medication File Intake</h1>
        <p className="muted">Owner/Admin workflow for local official medication files. No browser upload is enabled for this sprint.</p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Local File Inbox</h2>
            <p className="muted">Place owner-provided official exports or official source files in the ignored local inbox.</p>
          </div>
          <span className="badge warning">No files committed</span>
        </div>
        <div className="data-list two-column">
          <article className="data-row">
            <strong>Inbox path</strong>
            <p className="muted">storage/official-medication-inbox/</p>
          </article>
          <article className="data-row">
            <strong>Accepted file types</strong>
            <p className="muted">JSON, JSONL, CSV, XLSX, XLS, and ZIP. ZIP files are scanned as unsupported containers until a safe mapper is added.</p>
          </article>
          <article className="data-row">
            <strong>Current status rules</strong>
            <p className="muted">No file means restore remains blocked. RESTORE_READY means a prior approved app export can be dry-run. NEEDS_MAPPER means owner review and a focused parser sprint are required.</p>
          </article>
          <article className="data-row">
            <strong>Safety boundary</strong>
            <p className="muted">Rows are not imported, verified, or used for prescription selection until a guarded restore or reviewed mapper succeeds.</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Owner Commands</h2>
          <span className="badge">Local CLI</span>
        </div>
        <div className="data-list">
          <article className="data-row">
            <strong>Scan inbox</strong>
            <pre>npm run medication:v099:inbox-scan</pre>
          </article>
          <article className="data-row">
            <strong>Dry-run restore</strong>
            <pre>npm run medication:v099:restore-inbox:dry-run</pre>
          </article>
          <article className="data-row">
            <strong>Apply restore after owner review</strong>
            <pre>npm run medication:v099:restore-inbox:apply</pre>
          </article>
          <article className="data-row">
            <strong>Readiness report</strong>
            <pre>npm run medication:v099:intake-ready</pre>
          </article>
        </div>
      </section>

      <SourceConnectorPanel />
    </AppShell>
  );
}
