"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell, SafetyAlert } from "../../mvp-page";

type Patient = { id: string; medicalRecordNumber?: string; firstName?: string; lastName?: string; phone?: string | null };
type Appointment = { id: string; patientId: string; doctorId?: string | null; startAt: string; status: string; appointmentType?: string | null; source?: string | null; notes?: string | null; cancellationReason?: string | null; noShowReason?: string | null; patient?: Patient };
type QueueTicket = { id: string; patientId: string; appointmentId?: string | null; queueNumber?: number; status: string; priority?: string; cancellationReason?: string | null; patient?: Patient; appointment?: Appointment | null };
type Invoice = { id: string; patientId: string; invoiceNumber?: string; status?: string; balanceAmount?: string | number };

export default function ReceptionTodayPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [status, setStatus] = useState("Loading today");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);
  const headers = token ? { authorization: `Bearer ${token}` } : undefined;
  const filteredPatients = patients.filter((patient) => patientLabel(patient).toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setStatus("Loading today");
    const [appointmentResponse, queueResponse, patientResponse, invoiceResponse] = await Promise.all([
      fetch(`${getApiBaseUrl()}/appointments/calendar?date=${today}`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/patients`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/billing/invoices`, { credentials: "include", headers })
    ]);
    setAppointments(appointmentResponse.ok ? ((await appointmentResponse.json()) as { appointments?: Appointment[] }).appointments ?? [] : []);
    setQueue(queueResponse.ok ? ((await queueResponse.json()) as { queueTickets?: QueueTicket[] }).queueTickets ?? [] : []);
    setPatients(patientResponse.ok ? ((await patientResponse.json()) as { patients?: Patient[] }).patients ?? [] : []);
    setInvoices(invoiceResponse.ok ? ((await invoiceResponse.json()) as { invoices?: Invoice[] }).invoices ?? [] : []);
    setStatus("Ready");
  }

  async function checkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      patientId: String(form.get("patientId") ?? ""),
      appointmentId: String(form.get("appointmentId") ?? "") || undefined,
      priority: String(form.get("priority") ?? "routine")
    };
    const response = await fetch(`${getApiBaseUrl()}/queue/check-in`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", ...(headers ?? {}) },
      body: JSON.stringify(payload)
    });
    setMessage(response.ok ? "Patient checked in." : "Could not check in patient. Check the selected file and role.");
    if (response.ok) await load();
  }

  const waiting = queue.filter((ticket) => ["waiting", "called"].includes(ticket.status));

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Reception</p>
            <h1>Today&apos;s Reception Workspace</h1>
          </div>
          <div className="topbar-actions">
            <Link className="button compact" href="/patients/new"><ThreeDMedicalIcon name="patients" size="sm" />New Patient</Link>
            <button className="button secondary compact" type="button" onClick={load}><ThreeDMedicalIcon name="search" size="sm" tone="slate" />Refresh</button>
          </div>
        </div>
        <p className="muted">Reception can schedule, check in, and hand patients to the doctor queue. Clinical decision tools stay outside this workspace.</p>
      </section>
      <SafetyAlert />
      <section className="metric-grid">
        <Metric label="Appointments today" value={appointments.length} />
        <Metric label="Waiting queue" value={waiting.length} />
        <Metric label="Unpaid notes" value={invoices.filter((invoice) => invoice.status !== "paid").length} />
        <Metric label="Workspace" value={status} />
      </section>
      <section className="content-grid">
        <article className="panel">
          <div className="section-heading"><h2>Check in or walk in</h2><span className="badge">Reception only</span></div>
          {message ? <p className="notice">{message}</p> : null}
          <form className="form-grid" onSubmit={checkIn}>
            <label>Patient file<select name="patientId" required><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientLabel(patient)}</option>)}</select></label>
            <label>Appointment<select name="appointmentId"><option value="">Walk-in or no appointment</option>{appointments.map((appointment) => <option key={appointment.id} value={appointment.id}>{appointmentTime(appointment.startAt)} - {patientLabel(appointment.patient)}</option>)}</select></label>
            <label>Queue priority<select name="priority"><option value="routine">Routine</option><option value="priority">Priority note</option></select></label>
            <button className="button" type="submit"><ThreeDMedicalIcon name="queue" size="sm" />Check in</button>
          </form>
        </article>
        <article className="panel">
          <div className="section-heading"><h2>Patient search</h2><Link className="button secondary compact" href="/patients">Open files</Link></div>
          <label>Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, file number, or phone" /></label>
          <div className="data-list">{filteredPatients.map((patient) => <Link className="data-row" key={patient.id} href={`/patients/${patient.id}`}><strong>{patientLabel(patient)}</strong><span className="badge">Open file</span></Link>)}</div>
        </article>
      </section>
      <section className="content-grid">
        <DailyList title="Today appointments" rows={appointments.map((appointment) => ({ id: appointment.id, patientId: appointment.patientId, title: `${appointmentTime(appointment.startAt)} - ${patientLabel(appointment.patient)}`, status: appointment.status, detail: [appointment.appointmentType, appointment.source, appointment.notes, appointment.cancellationReason, appointment.noShowReason].filter(Boolean).join(" | "), invoice: invoiceFor(invoices, appointment.patientId) }))} />
        <DailyList title="Waiting queue" rows={queue.map((ticket) => ({ id: ticket.id, patientId: ticket.patientId, title: `Queue ${ticket.queueNumber ?? ""} - ${patientLabel(ticket.patient)}`, status: ticket.status, detail: [ticket.priority, ticket.appointment?.appointmentType, ticket.cancellationReason].filter(Boolean).join(" | "), invoice: invoiceFor(invoices, ticket.patientId) }))} />
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <article className="metric-card"><span>{label}</span><strong>{value}</strong></article>;
}

function DailyList({ title, rows }: { title: string; rows: Array<{ id: string; patientId: string; title: string; status: string; detail: string; invoice?: Invoice }> }) {
  return (
    <article className="panel">
      <div className="section-heading"><h2>{title}</h2><span className="badge">{rows.length}</span></div>
      {rows.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>No records for today.</span></p> : null}
      <div className="data-list">
        {rows.map((row) => (
          <article className="data-row" key={row.id}>
            <div className="data-row-header"><strong>{row.title}</strong><span className="badge">{friendlyStatus(row.status)}</span></div>
            <p className="muted">{row.detail || "No extra reception note."}</p>
            <div className="form-actions">
              <Link className="button secondary compact" href={`/patients/${row.patientId}`}>Patient workspace</Link>
              {row.invoice ? <Link className="button secondary compact" href="/billing">{row.invoice.invoiceNumber ?? "Invoice"}: {friendlyStatus(row.invoice.status ?? "open")}</Link> : <span className="badge">No invoice note</span>}
            </div>
          </article>
        ))}
      </div>
    </article>
  );
}

function patientLabel(patient?: Patient | null) {
  if (!patient) return "Patient";
  return `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim() || patient.medicalRecordNumber || "Patient";
}

function appointmentTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function invoiceFor(invoices: Invoice[], patientId: string) {
  return invoices.find((invoice) => invoice.patientId === patientId && invoice.status !== "paid");
}

function friendlyStatus(value: string) {
  return value.replaceAll("_", " ");
}
