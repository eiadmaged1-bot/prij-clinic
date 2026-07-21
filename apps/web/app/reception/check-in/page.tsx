"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { InlinePatientQrScanner } from "../../../components/clinic/InlinePatientQrScanner";
import { PatientPicker, type PatientPickerPatient } from "../../../components/clinic/PatientPicker";
import { VisitTypeSelector } from "../../../components/clinic/VisitTypeSelector";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { useIdempotencyKey } from "@/lib/idempotency-key";
import { publishClinicDataChange } from "@/lib/clinic-data-events";
import { formatSafeApiError, readSafeApiError } from "@/lib/safe-api-error";
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
    const patientId = new URLSearchParams(window.location.search).get("patientId");
    if (patientId) {
      const savedToken = sessionStorage.getItem("prijClinicToken");
      void fetch(`${getApiBaseUrl()}/patients/${encodeURIComponent(patientId)}`, { credentials: "include", headers: savedToken ? { authorization: `Bearer ${savedToken}` } : undefined })
        .then(async (response) => response.ok ? await response.json() as PatientPickerPatient : null)
        .then((patient) => { if (patient) selectPatient(patient); })
        .catch(() => setStatus("Could not load the selected patient. Search remains available."));
    }
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
    setSubmitting(true);
    setStatus("Adding patient to the waiting line…");
    const response = await fetch(`${getApiBaseUrl()}/queue/check-in`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", "idempotency-key": idempotencyKey, ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ patientId: selectedPatient.id, visitType, priority: visitType === "urgent_kashf" ? "priority" : "routine", checkInMethod: "Reception Check-in" })
    }).catch(() => null);
    if (!response) { setStatus(formatSafeApiError(await readSafeApiError(null, "The server could not be reached. Check the connection and retry with the same request."))); setSubmitting(false); return; }
    const body = await response.json().catch(() => null) as { queueNumber?: number; visitType?: string; queueState?: string; alreadyQueued?: boolean } | null;
    if (response.ok && body) {
      setTicket(body);
      setStatus(body.alreadyQueued ? "Patient is already waiting today" : "Patient added to waiting line");
      publishClinicDataChange(["queue", "patient", "timeline", "owner-operations"], selectedPatient.id);
    } else setStatus(formatSafeApiError(await readSafeApiError(response, "The waiting line could not be updated safely.")));
    setSubmitting(false);
  }

  return <AppShell>
    <section className="page-header"><div className="header-row"><div><p className="eyebrow">Reception</p><h1>Check in patient</h1></div><Link className="button secondary compact" href="/reception">Back to Reception</Link></div><p className="muted">Select the patient by live search or QR.</p></section>
    <SafetyAlert />
    <section className="panel compact-panel reception-check-in-compact">
      <article className="compact-panel">
        <div className="reception-check-in-patient-tools">
          <InlinePatientQrScanner onPatientResolved={selectPatient} />
          {selectedPatient ? <button className="button secondary compact" type="button" onClick={() => selectPatient(null)}>Clear selection</button> : null}
        </div>
        <PatientPicker
          patients={selectedPatient ? [selectedPatient] : []}
          selectedPatientId={selectedPatient?.id ?? ""}
          onSelect={(id) => { if (!id) selectPatient(null); }}
          onPatientSelect={selectPatient}
          required
          label="Select patient"
          storageKey="check-in"
        />
      </article>
      {selectedPatient ? <article className="compact-panel"><VisitTypeSelector value={visitType} onChange={setVisitType} compact /><button className="button" type="button" onClick={() => void submit()} disabled={!visitType || submitting}><ThreeDMedicalIcon name="queue" size="sm" />{submitting ? "Adding…" : "Add to waiting line"}</button></article> : null}
      {status ? <p className={ticket ? "success-message" : "notice"} role="status">{status}</p> : null}
      {ticket ? <article className="queue-position-card"><strong>Queue number {ticket.queueNumber ?? "—"}</strong><span>Visit type: {ticket.visitType ?? visitType}</span><span>Status: {ticket.queueState === "WAITING" ? "Waiting" : ticket.queueState ?? "Waiting"}</span></article> : null}
    </section>
  </AppShell>;
}
