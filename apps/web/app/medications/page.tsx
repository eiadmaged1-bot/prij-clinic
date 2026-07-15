"use client";

import { AppShell } from "../mvp-page";
import { PharmacologyWorkspace } from "../../components/medications/PharmacologyWorkspace";
import { DermatologyWorkspace } from "../../components/medications/DermatologyWorkspace";
import { useState } from "react";

export default function MedicationCenterPage() {
  const [mode, setMode] = useState<"pharmacology" | "dermatology">("pharmacology");
  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Clinical knowledge</p>
        <h1>{mode === "pharmacology" ? "Pharmacology Atlas" : "Dermatology"}</h1>
        <p className="muted">Generic-first, source-backed, summary-first reference. Trade names are optional aliases and never replace generic identity.</p>
      </section>
      <nav className="summary-level-switch" aria-label="Clinical knowledge mode"><button className={mode === "pharmacology" ? "active" : ""} onClick={() => setMode("pharmacology")} type="button">Pharmacology</button><button className={mode === "dermatology" ? "active" : ""} onClick={() => setMode("dermatology")} type="button">Dermatology</button></nav>
      {mode === "pharmacology" ? <PharmacologyWorkspace /> : <DermatologyWorkspace />}
    </AppShell>
  );
}
