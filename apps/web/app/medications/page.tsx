"use client";

import { AppShell } from "../mvp-page";
import { PharmacologyWorkspace } from "../../components/medications/PharmacologyWorkspace";
import Link from "next/link";

export default function MedicationCenterPage() {
  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Clinical knowledge</p>
        <h1>Pharmacology Atlas</h1>
        <p className="muted">Generic-first, source-backed, summary-first reference. Trade names are optional aliases and never replace generic identity.</p>
      </section>
      <nav className="summary-level-switch" aria-label="Clinical knowledge routes"><span className="active" aria-current="page">Pharmacology</span><Link href="/dermatology">Dermatology</Link></nav>
      <PharmacologyWorkspace />
    </AppShell>
  );
}
