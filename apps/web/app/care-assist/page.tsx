import Link from "next/link";
import { AppShell } from "../mvp-page";

export default function CareAssistPage() {
  return (
    <AppShell>
      <section className="page-header">
        <h1>Care Assist</h1>
        <p className="muted">Completeness, follow-up, and medication safety review prompts. Open a patient file to run checks.</p>
      </section>
      <section className="panel">
        <div className="section-heading"><h2>Doctor review required</h2><span className="badge warning">Assist only</span></div>
        <p className="muted">Care Assist does not diagnose, prescribe, choose drugs, generate dose/frequency/duration, or rank treatments.</p>
        <Link className="button" href="/patients">Open Patient Files</Link>
      </section>
    </AppShell>
  );
}
