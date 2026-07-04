"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [message] = useState("");
  const [query, setQuery] = useState("");
  const [dateMode, setDateMode] = useState("today");
  const [customDate, setCustomDate] = useState(today);
  const [dateRangeStart, setDateRangeStart] = useState(today);
  const [dateRangeEnd, setDateRangeEnd] = useState(today);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showTrainingRecords, setShowTrainingRecords] = useState(false);
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);
  const headers = useMemo(() => token ? { authorization: `Bearer ${token}` } : undefined, [token]);
  const selectedDate = useMemo(() => dateForMode(dateMode, customDate, today), [customDate, dateMode, today]);
  const filteredPatients = patients.filter((patient) => patientSearchText(patient).includes(query.toLowerCase())).slice(0, 5);

  const load = useCallback(async () => {
    setStatus("Loading");
    const [appointmentResponse, queueResponse, patientResponse, invoiceResponse] = await Promise.all([
      fetch(`${getApiBaseUrl()}/appointments/calendar?date=${selectedDate}`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/patients`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/billing/invoices`, { credentials: "include", headers })
    ]);
    setAppointments(appointmentResponse.ok ? ((await appointmentResponse.json()) as { appointments?: Appointment[] }).appointments ?? [] : []);
    setQueue(queueResponse.ok ? ((await queueResponse.json()) as { queueTickets?: QueueTicket[] }).queueTickets ?? [] : []);
    setPatients(patientResponse.ok ? ((await patientResponse.json()) as { patients?: Patient[] }).patients ?? [] : []);
    setInvoices(invoiceResponse.ok ? ((await invoiceResponse.json()) as { invoices?: Invoice[] }).invoices ?? [] : []);
    setStatus("Ready");
  }, [headers, selectedDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const waiting = queue.filter((ticket) => ["waiting", "called"].includes(ticket.status));
  const deskCards = buildDeskCards(appointments, queue, invoices).filter((card) => {
    const textMatch = query.trim() ? card.searchText.includes(query.toLowerCase()) : true;
    const statusMatch = statusFilter === "all" || card.statusKey === statusFilter || card.paymentKey === statusFilter || card.resultKey === statusFilter || card.followUpKey === statusFilter;
    const trainingMatch = showTrainingRecords || !card.training;
    return textMatch && statusMatch && trainingMatch;
  });
  const hiddenTrainingCount = buildDeskCards(appointments, queue, invoices).filter((card) => card.training).length;
  const noPatients = deskCards.length === 0;

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Reception Today</p>
            <h1>Today Desk</h1>
          </div>
          <div className="topbar-actions">
            <Link className="button compact" href="/patients/new"><ThreeDMedicalIcon name="patients" size="sm" />New patient</Link>
            <Link className="button secondary compact" href="/reception/check-in"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" />Check-in</Link>
            <Link className="button secondary compact" href="/clinic-day/walkthrough"><ThreeDMedicalIcon name="timeline" size="sm" tone="slate" />Clinic walkthrough</Link>
            <Link className="button secondary compact" href="/queue"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" />Open queue</Link>
            <Link className="button secondary compact" href="/calendar"><ThreeDMedicalIcon name="calendar" size="sm" tone="slate" />Today appointments</Link>
            <button className="button secondary compact" type="button" onClick={load}><ThreeDMedicalIcon name="search" size="sm" tone="slate" />Refresh</button>
          </div>
        </div>
        <p className="muted">Fast front-desk workflow for search, check-in, queue handoff, appointments, and patient files.</p>
      </section>
      <SafetyAlert />
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Find today&apos;s patient</h2>
            <p className="muted">Search by name, phone, or file number. Use filters only when needed.</p>
          </div>
          <span className="badge">{status}</span>
        </div>
        <div className="toolbar">
          <label>Fast search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, phone, MRN / file number" /></label>
          <label>Date<select value={dateMode} onChange={(event) => setDateMode(event.target.value)}>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This week</option>
            <option value="custom">Custom date</option>
            <option value="range">Date range</option>
          </select></label>
          {dateMode === "custom" ? <label>Choose date<input type="date" value={customDate} onChange={(event) => setCustomDate(event.target.value)} /></label> : null}
          {dateMode === "range" ? <label>From<input type="date" value={dateRangeStart} onChange={(event) => setDateRangeStart(event.target.value)} /></label> : null}
          {dateMode === "range" ? <label>To<input type="date" value={dateRangeEnd} onChange={(event) => setDateRangeEnd(event.target.value)} /></label> : null}
          <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="waiting">Waiting</option>
            <option value="with_doctor">With doctor</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="payment_pending">Payment pending</option>
            <option value="results_pending">Results pending</option>
            <option value="follow_up_due">Follow-up due</option>
          </select></label>
          <button className={`button secondary compact ${showTrainingRecords ? "active" : ""}`} type="button" onClick={() => setShowTrainingRecords((value) => !value)}>
            {showTrainingRecords ? "Hide training records" : "Show training records"}
          </button>
        </div>
        {!showTrainingRecords && hiddenTrainingCount > 0 ? <p className="badge compact-safety-badge">Training records hidden: {hiddenTrainingCount}</p> : null}
        {dateMode === "range" ? <p className="muted">Showing selected range: {dateRangeStart} to {dateRangeEnd}. Current APIs use today&apos;s queue and selected appointment date.</p> : null}
        <div className="dense-card-list reception-inline-patient-results">
          {query.trim() ? filteredPatients.map((patient) => <Link className="picker-row" key={patient.id} href={`/patients/${patient.id}`}><strong>{patientLabel(patient)}</strong><span>{patient.medicalRecordNumber ?? "No file number"} | {patient.phone ?? "No phone"} | Open file</span></Link>) : null}
        </div>
        <Link className="button secondary compact" href="/patients">Open files</Link>
      </section>
      <section className="compact-metric-grid">
        <Metric label="Appointments" value={appointments.length} />
        <Metric label="Waiting queue" value={waiting.length} />
        <Metric label="Unpaid notes" value={invoices.filter((invoice) => invoice.status !== "paid").length} />
        <Metric label="Workspace" value={status} />
      </section>
      <section className="panel compact-panel">
        <div className="section-heading"><h2>Patient cards</h2><span className="badge">{deskCards.length}</span></div>
        {noPatients ? (
          <div className="empty-state compact-empty">
            <ThreeDMedicalIcon name="reception" size="sm" tone="slate" />
            <span>No patients checked in today.</span>
            <Link className="button compact" href="/patients/new">New patient</Link>
            <button className="button secondary compact" type="button" onClick={() => setDateMode("custom")}>Choose another date</button>
            <Link className="button secondary compact" href="/calendar">Open appointments</Link>
          </div>
        ) : null}
        <div className="dense-card-list">
          {deskCards.map((card) => (
            <article className="data-row dense" key={card.id}>
              <div className="data-row-header"><strong>{card.patientName}</strong><span className="badge">{friendlyStatus(card.status)}</span></div>
              <p className="muted">{card.fileLine} | Arrival {card.arrivalTime} | Doctor {card.doctorName} | {card.visitType}</p>
              <p className="muted">Payment: {card.paymentStatus}</p>
              <div className="form-actions">
                <Link className="button compact" href={`/patients/${card.patientId}`}>Open file</Link>
                <Link className="button secondary compact" href="/reception/check-in">Check-in</Link>
                <Link className="button secondary compact" href="/doctor/waiting">Send to doctor</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      {message ? <p className="notice">{message}</p> : null}
      <section className="content-grid">
        <DailyList title="Today appointments" rows={appointments.map((appointment) => ({ id: appointment.id, patientId: appointment.patientId, title: `${appointmentTime(appointment.startAt)} - ${patientLabel(appointment.patient)}`, status: appointment.status, detail: [appointment.appointmentType, appointment.source, appointment.notes, appointment.cancellationReason, appointment.noShowReason].filter(Boolean).join(" | "), invoice: invoiceFor(invoices, appointment.patientId) }))} />
        <DailyList title="Waiting queue" rows={queue.map((ticket) => ({ id: ticket.id, patientId: ticket.patientId, title: `Queue ${ticket.queueNumber ?? ""} - ${patientLabel(ticket.patient)}`, status: ticket.status, detail: [ticket.priority, ticket.appointment?.appointmentType, ticket.cancellationReason].filter(Boolean).join(" | "), invoice: invoiceFor(invoices, ticket.patientId) }))} />
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <article className="mini-metric-card"><span>{label}</span><strong>{value}</strong></article>;
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

function patientSearchText(patient?: Patient | null) {
  return `${patientLabel(patient)} ${patient?.medicalRecordNumber ?? ""} ${patient?.phone ?? ""}`.toLowerCase();
}

function dateForMode(mode: string, customDate: string, today: string) {
  if (mode === "yesterday") {
    const date = new Date(`${today}T00:00:00`);
    date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 10);
  }
  if (mode === "custom") return customDate || today;
  return today;
}

function buildDeskCards(appointments: Appointment[], queue: QueueTicket[], invoices: Invoice[]) {
  const appointmentCards = appointments.map((appointment) => {
    const invoice = invoiceFor(invoices, appointment.patientId);
    return {
      id: `appointment-${appointment.id}`,
      patientId: appointment.patientId,
      patientName: patientLabel(appointment.patient),
      fileLine: `${appointment.patient?.medicalRecordNumber ?? "No file number"} | ${appointment.patient?.phone ?? "No phone"}`,
      arrivalTime: appointmentTime(appointment.startAt),
      doctorName: appointment.doctorId ? "Assigned" : "Not assigned",
      visitType: appointment.appointmentType || "Visit",
      status: appointment.status,
      statusKey: appointment.status === "completed" ? "completed" : appointment.status === "cancelled" ? "cancelled" : "waiting",
      paymentStatus: invoice ? friendlyStatus(invoice.status ?? "payment pending") : "No payment note",
      paymentKey: invoice && invoice.status !== "paid" ? "payment_pending" : "",
      resultKey: "",
      followUpKey: "",
      searchText: `${patientSearchText(appointment.patient)} ${appointment.appointmentType ?? ""} ${appointment.status}`.toLowerCase(),
      training: isTrainingPatient(appointment.patient)
    };
  });

  const queueCards = queue.map((ticket) => {
    const invoice = invoiceFor(invoices, ticket.patientId);
    return {
      id: `queue-${ticket.id}`,
      patientId: ticket.patientId,
      patientName: patientLabel(ticket.patient),
      fileLine: `${ticket.patient?.medicalRecordNumber ?? "No file number"} | ${ticket.patient?.phone ?? "No phone"}`,
      arrivalTime: ticket.queueNumber ? `Queue ${ticket.queueNumber}` : "Checked in",
      doctorName: ticket.appointment?.doctorId ? "Assigned" : "Next available",
      visitType: ticket.appointment?.appointmentType || "Walk-in",
      status: ticket.status,
      statusKey: ticket.status === "called" ? "with_doctor" : ticket.status,
      paymentStatus: invoice ? friendlyStatus(invoice.status ?? "payment pending") : "No payment note",
      paymentKey: invoice && invoice.status !== "paid" ? "payment_pending" : "",
      resultKey: "",
      followUpKey: "",
      searchText: `${patientSearchText(ticket.patient)} ${ticket.status} ${ticket.priority ?? ""}`.toLowerCase(),
      training: isTrainingPatient(ticket.patient)
    };
  });

  return [...queueCards, ...appointmentCards];
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

function isTrainingPatient(patient?: Patient | null) {
  const name = `${patient?.firstName ?? ""} ${patient?.lastName ?? ""}`.trim();
  const mrn = patient?.medicalRecordNumber ?? "";
  return /^Demo\b/i.test(name) || /^DEMO[-_]/i.test(mrn) || /Local training/i.test(name);
}
