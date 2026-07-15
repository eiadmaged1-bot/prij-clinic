"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { PatientPicker, SelectedPatientSummary, type PatientPickerPatient } from "../../../components/clinic/PatientPicker";
import { VisitTypeSelector } from "../../../components/clinic/VisitTypeSelector";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { useIdempotencyKey } from "@/lib/idempotency-key";
import type { VisitTypeValue } from "@/lib/visit-types";
import { AppShell, SafetyAlert } from "../../mvp-page";

export default function ReceptionCheckInPage() {
  const [selectedPatient, setSelectedPatient] = useState<PatientPickerPatient | null>(null);
  const [visitType, setVisitType] = useState<VisitTypeValue | "">("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<{ queueNumber?: number; visitType?: string; queueState?: string; alreadyQueued?: boolean } | null>(null);
  const { key: idempotencyKey } = useIdempotencyKey();
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);

  useEffect(() => {
    const saved = sessionStorage.getItem("prij:check-in:selected-patient");
    if (saved) try { setSelectedPatient(JSON.parse(saved) as PatientPickerPatient); } catch { sessionStorage.removeItem("prij:check-in:selected-patient"); }
  }, []);

  function selectPatient(patient: PatientPickerPatient | null) {
    setSelectedPatient(patient);
    setTicket(null);
    setStatus("");
    if (patient) sessionStorage.setItem("prij:check-in:selected-patient", JSON.stringify(patient));
    else sessionStorage.removeItem("prij:check-in:selected-patient");
  }

  async function submit() {
    if (!selectedPatient || !visitType || submitting) { setStatus("Select a patient and visit type first."); return; }
    if (selectedPatient.status === "archived") { setStatus("Patient must be restored before Check-in."); return; }
    setSubmitting(true);
    setStatus("Adding patient to the waiting line…");
    const response = await fetch(`${getApiBaseUrl()}/queue/check-in`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", "idempotency-key": idempotencyKey, ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ patientId: selectedPatient.id, visitType, priority: visitType === "urgent_kashf" ? "priority" : "routine", checkInMethod: "Reception Check-in" })
    }).catch(() => null);
    if (!response) { setStatus("Could not add patient to the waiting line. Retry."); setSubmitting(false); return; }
    const body = await response.json().catch(() => null) as { queueNumber?: number; visitType?: string; queueState?: string; alreadyQueued?: boolean } | null;
    if (response.ok && body) {
      setTicket(body);
      setStatus(body.alreadyQueued ? "Patient is already waiting today" : "Patient added to waiting line");
      window.dispatchEvent(new CustomEvent("clinic-queue:changed", { detail: { patientId: selectedPatient.id } }));
    } else setStatus("Could not add patient to the waiting line. Retry.");
    setSubmitting(false);
  }

  const archived = selectedPatient?.status === "archived";
  return <AppShell>
    <section className="page-header"><div className="header-row"><div><p className="eyebrow">Reception</p><h1>Check in patient</h1></div><Link className="button secondary compact" href="/reception">Back to Reception</Link></div><p className="muted">Permanent QR and manual lookup are available in patient selection.</p></section>
    <SafetyAlert />
    <section className="panel compact-panel check-in-wizard">
      <article className="compact-panel"><span className="badge">Step 1</span><PatientPicker patients={[]} selectedPatientId={selectedPatient?.id ?? ""} onSelect={(id) => { if (!id) selectPatient(null); }} onPatientSelect={selectPatient} required label="Select existing patient" storageKey="check-in" /><div className="topbar-actions"><Link className="button secondary compact" href="/reception/qr-scan">Scan permanent QR</Link><Link className="button secondary compact" href="/patients/new">Create new patient</Link></div></article>
      {archived ? <article className="notice"><strong>Archived patient</strong><span>This patient must be restored before Check-in.</span><div className="topbar-actions"><Link className="button secondary compact" href={`/patients/${selectedPatient.id}`}>Open read-only profile</Link><Link className="button compact" href={`/patients/${selectedPatient.id}`}>Restore patient</Link><button className="button secondary compact" type="button" onClick={() => selectPatient(null)}>Choose another patient</button></div></article> : null}
      {selectedPatient && !archived ? <>
        <article className="compact-panel"><span className="badge">Step 2</span><VisitTypeSelector value={visitType} onChange={setVisitType} compact /></article>
        <article className="compact-panel"><span className="badge">Step 3</span><SelectedPatientSummary patient={selectedPatient} /><button className="button" type="button" onClick={() => void submit()} disabled={!visitType || submitting}><ThreeDMedicalIcon name="queue" size="sm" />{submitting ? "Adding…" : "Add to waiting line"}</button></article>
      </> : null}
      {status ? <p className={ticket ? "success-message" : "notice"} role="status">{status}</p> : null}
      {ticket ? <article className="queue-position-card"><strong>Queue number {ticket.queueNumber ?? "—"}</strong><span>Visit type: {ticket.visitType ?? visitType}</span><span>Status: {ticket.queueState === "WAITING" ? "Waiting" : ticket.queueState ?? "Waiting"}</span><Link className="button secondary compact" href="/queue">Open queue</Link></article> : null}
    </section>
  </AppShell>;
}
