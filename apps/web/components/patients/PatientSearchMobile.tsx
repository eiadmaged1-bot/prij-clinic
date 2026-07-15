"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PatientPicker, type PatientPickerPatient } from "@/components/clinic/PatientPicker";

export function PatientSearchMobile() {
  const [selected, setSelected] = useState<PatientPickerPatient | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("prij:doctor:selected-patient");
    if (saved) {
      try { setSelected(JSON.parse(saved) as PatientPickerPatient); } catch { sessionStorage.removeItem("prij:doctor:selected-patient"); }
    }
  }, []);

  function select(patient: PatientPickerPatient | null) {
    setSelected(patient);
    if (patient) sessionStorage.setItem("prij:doctor:selected-patient", JSON.stringify(patient));
    else sessionStorage.removeItem("prij:doctor:selected-patient");
  }

  return <section className="panel compact-panel doctor-patient-tool" id="doctor-patient-search">
    <div className="section-heading"><h2>Search patient</h2><span className="badge">Branch scoped</span></div>
    <PatientPicker patients={[]} selectedPatientId={selected?.id ?? ""} onSelect={(id) => { if (!id) select(null); }} onPatientSelect={select} required label="Select patient" storageKey="doctor-patient-search" />
    {selected ? <div className="topbar-actions"><Link className="button secondary compact" href={`/patients/${selected.id}`}>Open patient file</Link><Link className="button compact" href={`/patients/${selected.id}?startVisit=1`}>Start direct visit</Link></div> : null}
  </section>;
}
