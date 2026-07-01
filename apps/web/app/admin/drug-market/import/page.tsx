import { AppShell, SafetyAlert } from "../../../mvp-page";
import { acceptedFileTypes, inboxRelativePath, loadOfficialMedicationImportStatus } from "../../../../server/official-medication-import-status";

export const dynamic = "force-dynamic";

export default async function AdminDrugMarketImportPage() {
  const status = await loadOfficialMedicationImportStatus();

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Owner / Admin</p>
            <h1>Official Medication Import</h1>
          </div>
          <div className="topbar-actions">
            <span className={`badge ${status.ready ? "accent" : "warning"}`}>{status.ready ? "Import ready" : "Import blocked"}</span>
            <span className="badge">Reference metadata only</span>
          </div>
        </div>
        <p className="muted">
          Import authorized official medication registry files as reference metadata. Strength, form, and pack are not patient directions.
        </p>
      </section>

      <SafetyAlert />

      <section className="content-grid">
        <div className="metric-card">
          <span>Official rows</span>
          <strong>{formatCount(status.officialRows)}</strong>
        </div>
        <div className="metric-card">
          <span>Verified rows</span>
          <strong>{formatCount(status.verifiedRows)}</strong>
        </div>
        <div className="metric-card">
          <span>Needs review</span>
          <strong>{formatCount(status.needsReviewRows)}</strong>
        </div>
        <div className="metric-card">
          <span>Inbox candidates</span>
          <strong>{status.supportedCandidates}</strong>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Local Inbox</h2>
              <p className="muted">Place authorized official registry/source files here, then run Scan.</p>
            </div>
            <span className={`badge ${status.ready ? "accent" : "warning"}`}>{status.ready ? "Ready" : "Blocked"}</span>
          </div>

          <dl className="profile-grid">
            <div>
              <dt>Inbox path</dt>
              <dd className="pc-mono">{inboxRelativePath}</dd>
            </div>
            <div>
              <dt>Accepted file types</dt>
              <dd>{acceptedFileTypes.join(", ")}</dd>
            </div>
            <div>
              <dt>Unsupported files</dt>
              <dd>{status.unsupportedFiles}</dd>
            </div>
            <div>
              <dt>Database status</dt>
              <dd>{status.dbStatus}</dd>
            </div>
          </dl>

          <p className="muted">
            Imported medication data is reference and market metadata only. Doctor-written prescription directions remain manual.
          </p>
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Operator Commands</h2>
              <p className="muted">Run these from the project root after placing authorized files in the local inbox.</p>
            </div>
            <span className="badge">Dry run first</span>
          </div>

          <div className="command-list">
            {[
              "npm run medication:v100:source-list",
              "npm run medication:v100:reimport:dry-run",
              "npm run medication:v100:reimport:apply",
              "npm run medication:v097:ready-check:strict",
              "npm run prescriptions:v097:medication-selection-check"
            ].map((command) => (
              <code key={command}>{command}</code>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function formatCount(value: number | null) {
  return value === null ? "Unavailable" : value.toLocaleString();
}
