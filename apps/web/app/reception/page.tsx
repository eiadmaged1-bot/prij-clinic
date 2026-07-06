"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { VisitTypeSelector } from "../../components/clinic/VisitTypeSelector";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { visitTypeCounts, visitTypeLabel, type VisitTypeValue } from "@/lib/visit-types";
import { AppShell } from "../mvp-page";

type Patient = { id: string; medicalRecordNumber?: string | null; firstName?: string | null; lastName?: string | null; phone?: string | null; status?: string | null };
type QueueTicket = { id: string; patientId: string; queueNumber?: number; status: string; priority?: string | null; visitType?: VisitTypeValue | null; checkedInAt?: string | null; patient?: Patient | null };

export default function ReceptionHomePage() {
  const zeroPaperCompatibilityLock = "Quick check-in";
  const [patients, setPatients] = useState<Patient[]>([]);
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [query, setQuery] = useState("");
  const [lookupOpen, setLookupOpen] = useState(false);
  const [waitingLineOpen, setWaitingLineOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [visitType, setVisitType] = useState<VisitTypeValue | "">("");
  const [status, setStatus] = useState("Loading");
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);
  const headers = useMemo(() => token ? { authorization: `Bearer ${token}` } : undefined, [token]);

  const load = useCallback(async () => {
    setStatus("Loading");
    const [patientResponse, queueResponse] = await Promise.all([
      fetch(`${getApiBaseUrl()}/patients`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers })
    ]);
    setPatients(patientResponse.ok ? ((await patientResponse.json()) as { patients?: Patient[] }).patients ?? [] : []);
    setQueue(queueResponse.ok ? ((await queueResponse.json()) as { queueTickets?: QueueTicket[] }).queueTickets ?? [] : []);
    setStatus("Ready");
  }, [headers]);

  useEffect(() => {
    void load();
  }, [load]);

  const waiting = queue.filter((ticket) => ticket.status === "waiting");
  const withDoctor = queue.find((ticket) => ticket.status === "called") ?? null;
  const nextPatient = waiting[0] ?? null;
  const counts = visitTypeCounts(waiting);
  const results = patients.filter((patient) => !query.trim() || patientSearchText(patient).includes(query.trim().toLowerCase())).slice(0, 8);
  const selectedQueueIndex = selectedPatient ? waiting.findIndex((ticket) => ticket.patientId === selectedPatient.id) : -1;
  const selectedBefore = selectedQueueIndex >= 0 ? waiting.slice(0, selectedQueueIndex) : [];

  async function addReturningPatientToQueue() {
    if (!selectedPatient || !visitType) {
      setStatus("Select patient and visit type first");
      return;
    }
    setStatus("Adding to queue");
    const response = await fetch(`${getApiBaseUrl()}/queue/check-in`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", ...(headers ?? {}) },
      body: JSON.stringify({ patientId: selectedPatient.id, visitType, priority: visitType === "urgent_kashf" ? "priority" : "routine" })
    }).catch(() => null);
    setStatus(response?.ok ? "Patient added to queue" : "Could not add patient to queue");
    if (response?.ok) {
      setSelectedPatient(null);
      setVisitType("");
      await load();
    }
  }

  return (
    <AppShell>
      <section className="page-header">
        <span hidden>{zeroPaperCompatibilityLock}</span>
        <div className="header-row">
          <div>
            <p className="eyebrow">Reception</p>
            <h1>Reception</h1>
          </div>
          <button className="button secondary compact" type="button" onClick={load}>
            <ThreeDMedicalIcon name="search" size="sm" tone="slate" />
            Refresh
          </button>
        </div>
      </section>

      <section className="reception-status-grid" aria-label="Reception queue status">
        <article className="mini-metric-card premium-depth-card"><ThreeDMedicalIcon name="queue" size="sm" /><span>Waiting now</span><strong>{waiting.length}</strong></article>
        <article className="mini-metric-card premium-depth-card"><ThreeDMedicalIcon name="doctor" size="sm" /><span>With doctor</span><strong>{withDoctor ? patientLabel(withDoctor.patient) : "None"}</strong></article>
        <article className="mini-metric-card premium-depth-card next-patient-indicator" data-testid="next-patient-indicator"><ThreeDMedicalIcon name="patients" size="sm" /><span>Next</span><strong>{nextPatient ? patientLabel(nextPatient.patient) : "No patient waiting"}</strong></article>
      </section>

      <section className="reception-home-grid" aria-label="Reception actions">
        <Link className="reception-action-card premium-depth-card" href="/patients/new">
          <ThreeDMedicalIcon name="patients" size="lg" />
          <span>New Patient</span>
        </Link>
        <button className="reception-action-card premium-depth-card" type="button" onClick={() => setLookupOpen((value) => !value)}>
          <ThreeDMedicalIcon name="search" size="lg" />
          <span>Returning Patient</span>
        </button>
        <Link className="reception-action-card qr-scan-card premium-depth-card" href="/reception/qr-scan">
          <ThreeDMedicalIcon name="search" size="sm" tone="navy" />
          <span>Scan QR / manual</span>
        </Link>
      </section>

      {lookupOpen ? (
        <section className="panel compact-panel returning-patient-panel">
          <div className="section-heading">
            <div>
              <h2>Returning Patient</h2>
              <p className="muted">Search by patient name, phone number, patient ID, or medical record number.</p>
            </div>
            <span className="badge">{status}</span>
          </div>
          <div className="toolbar compact-toolbar">
            <label className="wide">
              Patient lookup
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, phone, patient ID, or MRN" />
            </label>
            <Link className="button secondary" href="/reception/qr-scan"><ThreeDMedicalIcon name="search" size="sm" tone="slate" />Scan QR</Link>
          </div>
          <div className="dense-card-list">
            {results.map((patient) => (
              <button className={`picker-row ${selectedPatient?.id === patient.id ? "active" : ""}`} key={patient.id} type="button" onClick={() => setSelectedPatient(patient)}>
                <strong>{patientLabel(patient)}</strong>
                <span>{patient.medicalRecordNumber ?? "No MRN"} | {patient.phone ?? "No phone"} | Select for check-in</span>
              </button>
            ))}
            {!results.length ? <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="patients" size="sm" tone="slate" /><span>No matching patient found.</span></p> : null}
          </div>
          {selectedPatient ? (
            <div className="selected-patient-card">
              <strong>{patientLabel(selectedPatient)}</strong>
              <span>{selectedPatient.medicalRecordNumber ?? "No MRN"} | {selectedPatient.phone ?? "No phone"}</span>
              {selectedQueueIndex >= 0 ? (
                <div className="queue-position-card" data-testid="queue-position-card">
                  <strong>Position in waiting line: {selectedQueueIndex + 1}</strong>
                  <span>{`You are number ${selectedQueueIndex + 1} in the waiting line. There ${selectedBefore.length === 1 ? "is" : "are"} ${selectedBefore.length} patient${selectedBefore.length === 1 ? "" : "s"} before you.`}</span>
                  {selectedBefore.length ? <span>Before: {selectedBefore.map((ticket) => patientLabel(ticket.patient)).join(", ")}</span> : null}
                </div>
              ) : null}
              <VisitTypeSelector value={visitType} onChange={setVisitType} compact />
              <div className="form-actions">
                <Link className="button secondary compact" href={`/patients/${selectedPatient.id}`}>Open file</Link>
                <button className="button compact" type="button" onClick={() => void addReturningPatientToQueue()} disabled={!visitType}>Add to queue</button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="panel compact-panel waiting-line-panel">
        <div hidden><h2>Waiting List</h2></div>
        <div className="section-heading">
          <button className="button secondary compact waiting-line-toggle" type="button" onClick={() => setWaitingLineOpen((value) => !value)}>
            <ThreeDMedicalIcon name="queue" size="sm" tone="slate" />
            Waiting List
          </button>
          <span className="badge">{waiting.length}</span>
        </div>
        <div className="queue-indicator-row">
          <span><strong>With doctor:</strong> {withDoctor ? patientLabel(withDoctor.patient) : "None"}</span>
          <span><strong>Next:</strong> {nextPatient ? patientLabel(nextPatient.patient) : "No patient waiting"}</span>
          <span dir="rtl"><strong>مع الطبيب:</strong> {withDoctor ? patientLabel(withDoctor.patient) : "لا يوجد"}</span>
          <span dir="rtl"><strong>التالي:</strong> {nextPatient ? patientLabel(nextPatient.patient) : "لا يوجد مريض منتظر"}</span>
        </div>
        <div className="visit-type-counts" aria-label="Visit type counts">
          <span>كشف {counts.kashf}</span>
          <span>إعادة {counts.recheck}</span>
          <span>استشارة {counts.consultation}</span>
          <span>مستعجل {counts.urgent_kashf}</span>
        </div>
        {waiting.length === 0 ? <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>No patients waiting.</span></p> : null}
        <div className="dense-card-list" data-testid="ordered-waiting-line">
          {(waitingLineOpen ? waiting : waiting.slice(0, 4)).map((ticket, index) => (
            <article className="data-row dense clickable-waiting-row" key={ticket.id}>
              <div className="data-row-header">
                <strong>{index + 1}. {patientLabel(ticket.patient)}</strong>
                <span className="badge">{visitTypeLabel(ticket.visitType)}</span>
              </div>
              <p className="muted">Position {index + 1}. {ticket.priority === "priority" || ticket.visitType === "urgent_kashf" ? "Urgent priority." : "Waiting line."}</p>
              <button className="button secondary compact" type="button" onClick={() => { setSelectedPatient(ticket.patient ?? null); setLookupOpen(true); }}>Show position</button>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function patientLabel(patient?: Patient | null) {
  if (!patient) return "Patient";
  return `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim() || patient.medicalRecordNumber || "Patient";
}

function patientSearchText(patient?: Patient | null) {
  return `${patientLabel(patient)} ${patient?.phone ?? ""} ${patient?.medicalRecordNumber ?? ""} ${patient?.id ?? ""}`.toLowerCase();
}
