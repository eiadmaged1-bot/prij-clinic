"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../mvp-page";
import { MedicationProfileCard, MedicationSearchBox } from "../../components/medications/MedicationComponents";
import type { MedicationResult } from "../../lib/medications";
import Link from "next/link";

type MedicationCenterTab = "search" | "templates" | "saved";

export default function MedicationCenterPage() {
  const [activeTab, setActiveTab] = useState<MedicationCenterTab>("search");
  const [selectedMedication, setSelectedMedication] = useState<MedicationResult | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested === "templates" || requested === "saved" || requested === "search") setActiveTab(requested);
    setQuery(new URLSearchParams(window.location.search).get("query") ?? "");
  }, []);

  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Doctor reference and reusable prescribing tools</p>
        <h1>Medication Center</h1>
      </section>
      <p className="notice medication-center-notice">Market product data and clinical safety guidance are separate. No auto-prescribing. Doctor approval required.</p>
      <nav className="patient-tabs simple medication-center-tabs" aria-label="Medication Center sections">
        <button className={`tab-button ${activeTab === "search" ? "active" : ""}`} type="button" onClick={() => setActiveTab("search")}>Search &amp; Reference</button>
        <button className={`tab-button ${activeTab === "templates" ? "active" : ""}`} type="button" onClick={() => setActiveTab("templates")}>Templates</button>
        <button className={`tab-button ${activeTab === "saved" ? "active" : ""}`} type="button" onClick={() => setActiveTab("saved")}>Saved Medications</button>
      </nav>
      {activeTab === "search" ? <div className="medication-center-search-grid"><MedicationSearchBox queryValue={query} onQueryChange={setQuery} onSelect={setSelectedMedication} /><MedicationProfileCard medication={selectedMedication} /></div> : null}
      {activeTab === "templates" ? (
        <section className="panel medication-center-section">
          <div className="section-heading"><div><h2>Prescription Templates</h2><p className="muted">Favorites, personal templates, clinic templates, and recently used sets.</p></div><Link className="button compact" href="/prescriptions?tab=templates">Manage templates</Link></div>
          <p className="empty-state compact">Templates are reusable drafts. Creating one does not create a patient prescription.</p>
        </section>
      ) : null}
      {activeTab === "saved" ? (
        <section className="panel medication-center-section">
          <div className="section-heading"><div><h2>Saved Medications</h2><p className="muted">Favorites, frequently prescribed medicines, recent medicines, and saved shortcuts.</p></div><Link className="button compact" href="/prescriptions?tab=saved">Manage saved medications</Link></div>
          <p className="empty-state compact">Usage details appear only when recorded by the existing prescription workflow.</p>
        </section>
      ) : null}
    </AppShell>
  );
}
