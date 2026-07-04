"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { PatientPicker, SelectedPatientSummary, patientLabel, type PatientPickerPatient } from "../../../components/clinic/PatientPicker";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell, SafetyAlert } from "../../mvp-page";

type Patient = PatientPickerPatient;
type Appointment = { id: string; patientId: string; startAt: string; status: string; appointmentType?: string | null; patient?: Patient };

export default function ReceptionCheckInPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentQuery, setAppointmentQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [priority, setPriority] = useState("routine");
  const [status, setStatus] = useState("Loading");
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);
  const headers = useMemo(() => token ? { authorization: `Bearer ${token}` } : undefined, [token]);

  const load = useCallback(async () => {
    setStatus("Loading");
    const [patientResponse, appointmentResponse] = await Promise.all([
      fetch(`${getApiBaseUrl()}/patients`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/appointments/calendar?date=${today}`, { credentials: "include", headers })
    ]);
    setPatients(patientResponse.ok ? ((await patientResponse.json()) as { patients?: Patient[] }).patients ?? [] : []);
    setAppointments(appointmentResponse.ok ? ((await appointmentResponse.json()) as { appointments?: Appointment[] }).appointments ?? [] : []);
    setStatus("Ready");
  }, [headers, today]);

  useEffect(() => { void load(); }, [load]);

  const appointmentMatches = appointments
    .filter((appointment) => !selectedPatient || appointment.patientId === selectedPatient.id)
    .filter((appointment) => `${appointmentLabel(appointment)} ${appointment.status}`.toLowerCase().includes(appointmentQuery.toLowerCase()))
    .slice(0, 8);

  async function submit() {
    if (!selectedPatient) {
      setStatus("Select a patient first");
      return;
    }
    const response = await fetch(`${getApiBaseUrl()}/queue/check-in`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", ...(headers ?? {}) },
      body: JSON.stringify({
        patientId: selectedPatient.id,
        appointmentId: selectedAppointment?.id || undefined,
        priority
      })
    });
    setStatus(response.ok ? "Patient checked in" : "Could not check in patient");
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Reception</p>
            <h1>Check-in</h1>
          </div>
          <div className="topbar-actions">
            <Link className="button secondary compact" href="/reception/today"><ThreeDMedicalIcon name="reception" size="sm" tone="slate" />Today Desk</Link>
            <Link className="button compact" href="/patients/new"><ThreeDMedicalIcon name="patients" size="sm" />New patient</Link>
          </div>
        </div>
        <p className="muted">Fast patient check-in without large dropdowns. Walk-ins can continue without an appointment.</p>
      </section>
      <SafetyAlert />
      <section className="panel compact-panel check-in-wizard">
        <div className="section-heading"><h2>Check in or walk in</h2><span className="badge">{status}</span></div>
        <div className="wizard-steps">
          <article className="compact-panel">
            <span className="badge">Step 1</span>
            <PatientPicker patients={patients} selectedPatientId={selectedPatient?.id ?? ""} onSelect={(id) => { setSelectedPatient(patients.find((patient) => patient.id === id) ?? null); setSelectedAppointment(null); }} required label="Select patient" />
          </article>
          <article className="compact-panel">
            <span className="badge">Step 2</span>
            <label>Appointment or walk-in<input value={appointmentQuery} onChange={(event) => setAppointmentQuery(event.target.value)} placeholder="Search appointment or leave walk-in" /></label>
            <button className={`picker-row ${!selectedAppointment ? "active" : ""}`} type="button" onClick={() => setSelectedAppointment(null)}><strong>Walk-in / no appointment</strong><span>Use when no booking exists.</span></button>
            <div className="dense-card-list">
              {appointmentMatches.map((appointment) => <button className={`picker-row ${selectedAppointment?.id === appointment.id ? "active" : ""}`} key={appointment.id} type="button" onClick={() => setSelectedAppointment(appointment)}><strong>{appointmentLabel(appointment)}</strong><span>{appointment.status}</span></button>)}
            </div>
          </article>
          <article className="compact-panel">
            <span className="badge">Step 3</span>
            <div className="segmented-control" aria-label="Queue priority">
              {["routine", "priority"].map((value) => <button className={priority === value ? "active" : ""} key={value} type="button" onClick={() => setPriority(value)}>{value === "routine" ? "Routine" : "Priority note"}</button>)}
            </div>
            {selectedPatient ? <SelectedPatientSummary patient={selectedPatient} /> : <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="patients" size="sm" tone="slate" /><span>No patient selected.</span></p>}
          </article>
          <article className="compact-panel">
            <span className="badge">Step 4</span>
            <button className="button" type="button" onClick={() => void submit()} disabled={!selectedPatient}><ThreeDMedicalIcon name="queue" size="sm" />Check in</button>
            <p className="muted">Patient file, appointment link, and queue priority are saved for reception-to-doctor handoff.</p>
          </article>
        </div>
      </section>
    </AppShell>
  );
}

function appointmentLabel(appointment: Appointment) {
  return `${new Date(appointment.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${patientLabel(appointment.patient)} - ${appointment.appointmentType ?? "Visit"}`;
}
