"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell, SafetyAlert } from "../mvp-page";

type Patient = { id: string; medicalRecordNumber?: string | null; firstName?: string | null; lastName?: string | null; phone?: string | null; status?: string | null };
type QueueTicket = { id: string; patientId: string; queueNumber?: number; status: string; priority?: string | null; patient?: Patient | null };

export default function ReceptionHomePage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [query, setQuery] = useState("");
  const [lookupOpen, setLookupOpen] = useState(false);
  const [showTrainingRecords, setShowTrainingRecords] = useState(false);
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

  const visiblePatients = showTrainingRecords ? patients : patients.filter((patient) => !isTrainingPatient(patient));
  const visibleQueue = showTrainingRecords ? queue : queue.filter((ticket) => !isTrainingPatient(ticket.patient));
  const waiting = visibleQueue.filter((ticket) => ["waiting", "called"].includes(ticket.status));
  const hiddenTrainingCount = patients.filter(isTrainingPatient).length + queue.filter((ticket) => isTrainingPatient(ticket.patient)).length;
  const results = visiblePatients
    .filter((patient) => !query.trim() || patientSearchText(patient).includes(query.trim().toLowerCase()))
    .slice(0, 8);

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Reception</p>
            <h1>Front Desk</h1>
          </div>
          <div className="topbar-actions">
            <Link className="button secondary compact" href="/reception/today"><ThreeDMedicalIcon name="reception" size="sm" tone="slate" />Today desk</Link>
            <button className="button secondary compact" type="button" onClick={load}><ThreeDMedicalIcon name="search" size="sm" tone="slate" />Refresh</button>
          </div>
        </div>
      </section>
      <SafetyAlert />

      <section className="reception-home-grid" aria-label="Reception actions">
        <Link className="reception-action-card" href="/patients/new">
          <ThreeDMedicalIcon name="patients" size="lg" />
          <span>New Patient</span>
        </Link>
        <button className="reception-action-card" type="button" onClick={() => setLookupOpen((value) => !value)}>
          <ThreeDMedicalIcon name="search" size="lg" />
          <span>Returning Patient</span>
        </button>
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
          <div className="toolbar compact-toolbar">
            <label className="toggle-row">
              <input checked={showTrainingRecords} onChange={(event) => setShowTrainingRecords(event.target.checked)} type="checkbox" />
              Show training records
            </label>
            {!showTrainingRecords && hiddenTrainingCount > 0 ? <span className="badge compact-safety-badge">Training records hidden</span> : null}
          </div>
          <div className="dense-card-list">
            {results.map((patient) => (
              <Link className="picker-row" key={patient.id} href={`/patients/${patient.id}`}>
                <strong>{patientLabel(patient)}</strong>
                <span>{patient.medicalRecordNumber ?? "No MRN"} | {patient.phone ?? "No phone"} | Open file</span>
              </Link>
            ))}
            {!results.length ? <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="patients" size="sm" tone="slate" /><span>No matching patient found.</span></p> : null}
          </div>
        </section>
      ) : null}

      <section className="panel compact-panel">
        <div className="section-heading">
          <h2>Waiting List</h2>
          <span className="badge">{waiting.length}</span>
        </div>
        {waiting.length === 0 ? <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>No patients waiting.</span></p> : null}
        <div className="dense-card-list">
          {waiting.map((ticket) => (
            <article className="data-row dense" key={ticket.id}>
              <div className="data-row-header">
                <strong>Queue {ticket.queueNumber ?? ""} - {patientLabel(ticket.patient)}</strong>
                <span className="badge">{ticket.status.replaceAll("_", " ")}</span>
              </div>
              <p className="muted">{ticket.priority ?? "routine"} queue handoff.</p>
              <Link className="button secondary compact" href={`/patients/${ticket.patientId}`}>Open file</Link>
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

function isTrainingPatient(patient?: Patient | null) {
  const name = patientLabel(patient);
  const mrn = patient?.medicalRecordNumber ?? "";
  return /^Demo\b/i.test(name) || /^DEMO[-_]/i.test(mrn) || /Local training/i.test(name);
}
