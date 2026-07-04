"use client";

import Link from "next/link";
import { AppShell, SafetyAlert } from "../../mvp-page";

export default function AdminSettingsPage() {
  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Owner tools</p>
            <h1>Clinic Settings</h1>
          </div>
          <span className="badge accent">Protected</span>
        </div>
        <p className="muted">Owner and admin settings for clinic identity, working hours, billing defaults, appearance, safety review, and audited feature controls.</p>
      </section>
      <SafetyAlert />
      <section className="module-grid">
        {[
          ["Clinic name", "Displayed on print-friendly invoice and packet headers when configured."],
          ["Phone and address", "Reception-facing contact details for local clinic operations."],
          ["Working hours", "Default schedule guidance for calendar and daily desk views."],
          ["Appointment duration", "Default visit length for new appointments when a specific time is not selected."],
          ["Currency default", "Clinic billing currency for service catalog prices and invoice summaries."],
          ["Invoice numbering", "Prefix and default numbering remain clinic billing settings only."],
          ["Receipt footer note", "Optional print note for manual payment receipts and statements."],
          ["Service prices", "Clinic billing services are managed from the Owner Service Catalog."],
          ["Appearance", "Theme defaults are protected and audited."],
          ["Medication safety review", "Medication safety source review remains separate from clinic service prices."],
          ["Feature flags", "Future controls stay owner-controlled and audited."]
        ].map(([title, description]) => (
          <article className="module-card" key={title}>
            <strong>{title}</strong>
            <span className="muted">{description}</span>
          </article>
        ))}
      </section>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Audit and access</h2>
            <p className="muted">Only Owner/Admin users should change clinic settings. Settings updates must keep audit records and avoid secrets or patient data.</p>
          </div>
          <span className="badge">Owner/Admin</span>
        </div>
        <div className="form-actions">
          <Link className="button" href="/admin/services">Service Catalog</Link>
          <Link className="button secondary" href="/admin/appearance">Appearance</Link>
          <Link className="button secondary" href="/admin/medication-safety-profiles">Medication Safety Review</Link>
          <Link className="button secondary" href="/admin/audit">Audit Log</Link>
        </div>
      </section>
    </AppShell>
  );
}
