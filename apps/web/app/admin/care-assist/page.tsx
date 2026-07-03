import { AppShell } from "../../mvp-page";

export default function AdminCareAssistPage() {
  return (
    <AppShell>
      <section className="page-header">
        <h1>Care Assist Controls</h1>
        <p className="muted">Local rule visibility for documentation and safety-review prompts.</p>
      </section>
      <section className="panel">
        <div className="section-heading"><h2>Boundaries</h2><span className="badge warning">Owner/Admin</span></div>
        <p className="muted">Rules are local prompts for missing fields, follow-up review, source review, and medication safety visibility. They are not treatment recommendations.</p>
      </section>
    </AppShell>
  );
}
