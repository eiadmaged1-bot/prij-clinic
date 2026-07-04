import Link from "next/link";
import { AppShell, SafetyAlert } from "../mvp-page";

export default function OrdersCompatibilityPage() {
  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Clinical Requests</p>
        <h1>Requested Investigations</h1>
        <p className="muted">This route is kept for compatibility. New work uses clinical requests, requested investigations, and result follow-up wording.</p>
        <div className="topbar-actions">
          <Link className="button" href="/investigations">Open Clinical Requests</Link>
        </div>
      </section>
      <SafetyAlert />
    </AppShell>
  );
}
