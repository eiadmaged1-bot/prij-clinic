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
        <p className="muted">Owner and admin settings for clinic profile, branches, rooms, appearance, safety review, and feature controls.</p>
      </section>
      <SafetyAlert />
      <section className="module-grid">
        {[
          ["Clinic profile", "Clinic identity and contact settings are planned for the guarded settings flow."],
          ["Branches and rooms", "Branch support exists. Room setup remains a placeholder until scheduling needs it."],
          ["Service prices", "Clinic billing services are managed from the service catalog."],
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
