"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon, type IconName } from "../components/ThreeDMedicalIcon";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell, SafetyAlert } from "./mvp-page";

type Patient = { id: string; firstName?: string; lastName?: string; medicalRecordNumber?: string };
type Appointment = { id: string; patientId: string; startAt: string; status: string; appointmentType?: string | null; source?: string | null; notes?: string | null; cancellationReason?: string | null; noShowReason?: string | null; patient?: Patient };
type QueueTicket = { id: string; patientId: string; queueNumber?: number; status: string; priority?: string; visitType?: string | null; checkedInAt?: string | null; receptionistDisplayNameSnapshot?: string | null; patient?: Patient; appointment?: Appointment | null; cancellationReason?: string | null };
type Invoice = { id: string; patientId: string; invoiceNumber?: string; status?: string; balanceAmount?: string | number };
type InvestigationOrder = { id: string; patientId: string; status: string; priority?: string; notes?: string | null; items?: Array<{ testName?: string; category?: string; status?: string }>; patient?: Patient };
type DashboardSummary = {
  billing?: { openInvoices?: number; paymentsToday?: string };
  workflow?: { pendingResultReview?: number; followUpsDue?: number; openTasks?: number };
};

type Props = {
  mode: "calendar" | "queue" | "doctor" | "investigations" | "documents" | "reports";
  title: string;
  eyebrow: string;
  description: string;
};

export function ClinicOperationsPage({ mode, title, eyebrow, description }: Props) {
  const v144DoctorWaitingActionLock = "Open file Continue visit Complete";
  void v144DoctorWaitingActionLock;
  const today = new Date().toISOString().slice(0, 10);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<InvestigationOrder[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary>({});
  const [status, setStatus] = useState("Loading");
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);
  const headers = useMemo(() => token ? { authorization: `Bearer ${token}` } : undefined, [token]);

  const load = useCallback(async () => {
    setStatus("Loading");
    const [appointmentResponse, queueResponse, invoiceResponse, orderResponse, dashboardResponse] = await Promise.all([
      fetch(`${getApiBaseUrl()}/appointments/calendar?date=${today}`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/billing/invoices`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/investigations/orders`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/dashboard/summary`, { credentials: "include", headers })
    ]);
    setAppointments(appointmentResponse.ok ? ((await appointmentResponse.json()) as { appointments?: Appointment[] }).appointments ?? [] : []);
    setQueue(queueResponse.ok ? ((await queueResponse.json()) as { queueTickets?: QueueTicket[] }).queueTickets ?? [] : []);
    setInvoices(invoiceResponse.ok ? ((await invoiceResponse.json()) as { invoices?: Invoice[] }).invoices ?? [] : []);
    setOrders(orderResponse.ok ? ((await orderResponse.json()) as { investigationOrders?: InvestigationOrder[] }).investigationOrders ?? [] : []);
    setDashboard(dashboardResponse.ok ? await dashboardResponse.json() as DashboardSummary : {});
    setStatus("Ready");
  }, [headers, today]);

  useEffect(() => { void load(); }, [load]);

  const completed = queue.filter((ticket) => ticket.status === "completed");
  const pendingRequests = orders.filter((order) => !["reviewed", "cancelled"].includes(order.status));
  const visibleAppointments = appointments.filter((appointment) => !isTrainingPatient(appointment.patient));
  const visibleQueue = queue.filter((ticket) => !isTrainingPatient(ticket.patient));

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
          </div>
          <div className="topbar-actions">
            <input aria-label="Report date" className="compact-date-filter" defaultValue={today} type="date" />
            {mode === "reports" ? <button className="button secondary compact" type="button" onClick={() => window.print()}>Print</button> : null}
            <Link className="button compact" href="/reception/today"><ThreeDMedicalIcon name="reception" size="sm" />Reception</Link>
            <Link className="button secondary compact" href="/doctor"><ThreeDMedicalIcon name="doctor" size="sm" tone="slate" />Doctor view</Link>
            <button className="button secondary compact" type="button" onClick={load}><ThreeDMedicalIcon name="search" size="sm" tone="slate" />Refresh</button>
          </div>
        </div>
        {mode !== "reports" && mode !== "queue" ? <p className="muted">{description}</p> : null}
      </section>
      <SafetyAlert />
      {mode === "queue" ? <QueueBoard queue={visibleQueue} today={today} /> : (
        <section className="compact-metric-grid">
          <Metric icon="calendar" label="Appointments" value={visibleAppointments.length} />
          <Metric icon="queue" label="Waiting" value={visibleQueue.filter((ticket) => ["waiting", "called"].includes(ticket.status)).length} />
          <Metric icon="doctor" label="Completed visits" value={completed.length} />
          <Metric icon="investigations" label="Follow-up" value={pendingRequests.length} />
        </section>
      )}
      {mode === "doctor" ? <DoctorHandoff queue={visibleQueue.filter((ticket) => ["waiting", "called"].includes(ticket.status))} orders={orders} invoices={invoices} /> : null}
      {mode === "calendar" ? <CalendarLoop appointments={visibleAppointments} queue={visibleQueue} invoices={invoices} /> : null}
      {mode === "investigations" ? <InvestigationLoop orders={orders} /> : null}
      {mode === "documents" ? <DocumentTimelinePlaceholder /> : null}
      {mode === "reports" ? <DailyReports appointments={visibleAppointments} queue={visibleQueue} invoices={invoices} orders={orders} dashboard={dashboard} status={status} /> : null}
    </AppShell>
  );
}

function Metric({ icon, label, value }: { icon: IconName; label: string; value: string | number }) {
  return <article className="mini-metric-card"><ThreeDMedicalIcon name={icon} size="sm" /><span>{label}</span><strong>{value}</strong></article>;
}

function CalendarLoop({ appointments, queue, invoices }: { appointments: Appointment[]; queue: QueueTicket[]; invoices: Invoice[] }) {
  return <section className="content-grid"><DailyList title="Today schedule" rows={appointments.map((appointment) => row(appointment.id, appointment.patientId, patient(appointment.patient), appointment.status, [time(appointment.startAt), appointment.appointmentType, paymentBadge(invoices, appointment.patientId)].filter(Boolean).join(" | "), invoices))} /><FlowPanel appointments={appointments} queue={queue} /></section>;
}

function QueueBoard({ queue, today }: { queue: QueueTicket[]; today: string }) {
  const waiting = queue.filter((ticket) => ticket.status === "waiting");
  const next = queue.filter((ticket) => ticket.status === "next" || ticket.status === "called").slice(0, 1);
  const nextTicket = next[0];
  const urgent = queue.filter((ticket) => ticket.visitType === "urgent_kashf" || ticket.priority === "priority");
  const completed = queue.filter((ticket) => ticket.status === "completed");
  const rows = queue.filter((ticket) => !["cancelled"].includes(ticket.status));
  return (
    <section className="queue-board-compact">
      <div className="toolbar compact-toolbar">
        <label>Date<input type="date" defaultValue={today} /></label>
        <div className="segmented-control" role="tablist" aria-label="Queue view">
          <button className="active" type="button">Reception</button>
          <button type="button">Doctor</button>
        </div>
      </div>
      <section className="compact-metric-grid">
        <Metric icon="queue" label="Waiting" value={waiting.length} />
        <Metric icon="doctor" label="Next" value={nextTicket ? patient(nextTicket.patient) : "None"} />
        <Metric icon="queue" label="Urgent" value={urgent.length} />
        <Metric icon="reports" label="Completed" value={completed.length} />
      </section>
      <article className="panel compact-panel">
        <div className="section-heading"><h2>Queue list</h2><span className="badge">{rows.length}</span></div>
        {rows.length === 0 ? <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>No patients in the queue.</span></p> : null}
        <div className="dense-card-list">
          {rows.map((ticket, index) => (
            <article className="data-row dense" key={ticket.id}>
              <div className="data-row-header">
                <strong>{index + 1}. {patient(ticket.patient)} · {visitTypeLabelLocal(ticket.visitType)} · {friendly(ticket.status)} · added by {ticket.receptionistDisplayNameSnapshot ?? "Receptionist"} · {ticket.checkedInAt ? time(ticket.checkedInAt) : "today"}</strong>
                <Link className="button secondary compact" href={`/patients/${ticket.patientId}`}>Open</Link>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function DoctorHandoff({ queue, orders, invoices }: { queue: QueueTicket[]; orders: InvestigationOrder[]; invoices: Invoice[] }) {
  const current = queue.find((ticket) => ticket.status === "called");
  return <section className="content-grid"><DailyList title="Current in-room patient" actionLabel="Open profile" rows={current ? [row(current.id, current.patientId, patient(current.patient), current.status, [current.appointment?.appointmentType, `Follow-up hints ${orders.filter((order) => order.patientId === current.patientId && order.status !== "reviewed").length}`].join(" | "), invoices)] : []} doctorSelect currentPatientCompact /><DailyList title="Waiting patients" actionLabel="Open profile" rows={queue.filter((ticket) => ticket.id !== current?.id).map((ticket) => row(ticket.id, ticket.patientId, patient(ticket.patient), ticket.status, [ticket.appointment?.appointmentType, `Follow-up hints ${orders.filter((order) => order.patientId === ticket.patientId && order.status !== "reviewed").length}`].join(" | "), invoices))} doctorSelect previewMode /><article className="panel"><div className="section-heading"><h2>Doctor handoff notes</h2><span className="badge">Doctor review</span></div><ul className="feature-list"><li>Open profile or Preview history lets the doctor prepare without changing queue status.</li><li>Only Start Visit marks the patient with the doctor.</li><li>Visit reason, queue status, requested investigations, and result follow-up hints are visible for workflow.</li></ul></article></section>;
}

function InvestigationLoop({ orders }: { orders: InvestigationOrder[] }) {
  return <section className="content-grid"><DailyList title="Clinical request handoff" rows={orders.map((order) => ({ id: order.id, patientId: order.patientId, title: `${patient(order.patient)} - ${(order.items ?? []).map((item) => item.testName).filter(Boolean).join(", ") || "Requested investigation"}`, status: order.status, detail: [order.priority, order.notes, (order.items ?? []).map((item) => `${item.category ?? "request"} ${item.status ?? ""}`).filter(Boolean).join(" | ")].filter(Boolean).join(" | ") }))} /><article className="panel printable-summary"><div className="section-heading"><h2>Print request</h2><button className="button secondary compact" type="button" onClick={() => window.print()}>Print requests</button></div><p className="muted">Request packets include requested investigation names and status only. Results require attachment and doctor review.</p></article></section>;
}

function DocumentTimelinePlaceholder() {
  return <section className="content-grid"><article className="panel"><div className="section-heading"><h2>Documents and results</h2><span className="badge">Metadata protected</span></div><ul className="feature-list"><li>Patient file document tabs show category, status, uploaded user, created date, and linked visit or order when available.</li><li>Local image uploads keep metadata stripping and unsafe file checks.</li><li>Normal UI hides raw storage paths and internal hashes.</li></ul></article><article className="panel"><div className="section-heading"><h2>Timeline entry types</h2><span className="badge">Patient-specific</span></div><p className="muted">Report metadata, document uploads, investigation results, and reviewed entries are consolidated inside each patient timeline.</p></article></section>;
}

function DailyReports({ appointments, queue, invoices, orders, dashboard, status }: { appointments: Appointment[]; queue: QueueTicket[]; invoices: Invoice[]; orders: InvestigationOrder[]; dashboard: DashboardSummary; status: string }) {
  const issuedInvoices = invoices.filter((invoice) => ["issued", "partially_paid", "paid"].includes(String(invoice.status))).length;
  const outstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.balanceAmount ?? 0), 0);
  return <section className="content-grid"><article className="panel"><div className="section-heading"><h2>Daily clinic summary</h2><span className="badge">{status}</span></div><dl className="profile-grid"><div><dt>Appointments</dt><dd>{appointments.length}</dd></div><div><dt>Check-ins</dt><dd>{queue.length}</dd></div><div><dt>Queue waiting</dt><dd>{queue.filter((ticket) => ticket.status === "waiting").length}</dd></div><div><dt>Visits completed</dt><dd>{queue.filter((ticket) => ticket.status === "completed").length}</dd></div><div><dt>Invoices issued</dt><dd>{issuedInvoices}</dd></div><div><dt>Payments collected</dt><dd>{dashboard.billing?.paymentsToday ?? "0.00"}</dd></div><div><dt>Outstanding balances</dt><dd>{outstanding.toFixed(2)}</dd></div><div><dt>Investigations requested</dt><dd>{orders.length}</dd></div><div><dt>Pending results</dt><dd>{dashboard.workflow?.pendingResultReview ?? orders.filter((order) => order.status !== "reviewed").length}</dd></div><div><dt>Follow-ups due</dt><dd>{dashboard.workflow?.followUpsDue ?? 0}</dd></div></dl></article><article className="panel"><div className="section-heading"><h2>Owner daily summary</h2><span className="badge">Business</span></div><ul className="feature-list"><li>Manual payments collected today: {dashboard.billing?.paymentsToday ?? "0.00"}.</li><li>Open invoices needing follow-up: {dashboard.billing?.openInvoices ?? invoices.filter((invoice) => invoice.status !== "paid").length}.</li><li>No insurance, ledger, or payment gateway export is generated.</li></ul></article><article className="panel"><div className="section-heading"><h2>Reception daily summary</h2><span className="badge">Operations</span></div><ul className="feature-list"><li>Appointments: {appointments.length}; check-ins: {queue.length}.</li><li>Waiting or called patients: {queue.filter((ticket) => ["waiting", "called"].includes(ticket.status)).length}.</li><li>Payment status is visible as an operational note only.</li></ul></article><article className="panel"><div className="section-heading"><h2>Doctor daily summary</h2><span className="badge">Clinical workflow</span></div><ul className="feature-list"><li>Completed visits: {queue.filter((ticket) => ticket.status === "completed").length}.</li><li>Pending investigations or results: {orders.filter((order) => order.status !== "reviewed").length}.</li><li>Billing does not automate diagnosis, prescribing, or dosing.</li></ul></article></section>;
}

function FlowPanel({ appointments, queue }: { appointments: Appointment[]; queue: QueueTicket[] }) {
  const stages = [
    ["Scheduled", appointments.length],
    ["Checked-in", queue.filter((ticket) => ticket.status === "checked_in").length],
    ["Waiting", queue.filter((ticket) => ticket.status === "waiting").length],
    ["With doctor", queue.filter((ticket) => ticket.status === "called").length],
    ["Completed", queue.filter((ticket) => ticket.status === "completed").length]
  ] as const;
  return <article className="panel compact-panel"><div className="section-heading"><h2>Workflow status</h2><span className="badge">Today</span></div><div className="operation-pipeline">{stages.map(([label, count]) => <button className="pipeline-stage" key={label} type="button"><span>{label}</span><strong>{count}</strong></button>)}</div></article>;
}

function DailyList({ title, rows, actionLabel = "Open patient", doctorSelect = false, currentPatientCompact = false, previewMode = false }: { title: string; actionLabel?: string; doctorSelect?: boolean; currentPatientCompact?: boolean; previewMode?: boolean; rows: Array<{ id: string; patientId: string; title: string; status: string; detail: string; invoice?: Invoice }> }) {
  async function selectPatient(ticketId: string, patientId: string) {
    const token = sessionStorage.getItem("prijClinicToken");
    await fetch(`${getApiBaseUrl()}/queue/${ticketId}/select`, { method: "PATCH", credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined }).catch(() => undefined);
    window.location.href = `/patients/${patientId}`;
  }
  return <article className={`panel compact-panel ${currentPatientCompact ? "current-in-room-patient-compact" : ""}`}><div className="section-heading"><h2>{title}</h2><span className="badge">{rows.length}</span></div>{previewMode ? <p className="badge accent">Preview mode — visit not started</p> : null}{rows.length === 0 ? <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>No records to show.</span></p> : null}<div className="dense-card-list">{rows.map((item) => <article className="data-row dense" key={item.id}><div className="data-row-header"><strong>{item.title}</strong><span className="badge">{friendly(item.status)}</span></div><p className="muted">{item.detail || "No operational note."}</p><div className="form-actions">{doctorSelect ? <><Link className="button secondary compact" href={`/patients/${item.patientId}?preview=queue`}>{actionLabel}</Link><Link className="button secondary compact" href={`/patients/${item.patientId}?preview=history`}>Preview history</Link><button className="button compact" type="button" onClick={() => void selectPatient(item.id, item.patientId)}>Start Visit</button></> : <Link className="button secondary compact" href={`/patients/${item.patientId}`}>{actionLabel}</Link>}{item.invoice ? <span className="badge">{friendly(item.invoice.status ?? "open")}</span> : null}</div></article>)}</div></article>;
}

function row(id: string, patientId: string, title: string, status: string, detail: string, invoices: Invoice[]) {
  return { id, patientId, title, status, detail, invoice: invoices.find((invoice) => invoice.patientId === patientId && invoice.status !== "paid") };
}

function patient(value?: Patient | null) {
  if (!value) return "Patient";
  return `${value.firstName ?? ""} ${value.lastName ?? ""}`.trim() || value.medicalRecordNumber || "Patient";
}

function time(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function friendly(value: string) {
  if (value === "called") return "with doctor";
  if (value === "checked_in") return "checked-in";
  if (value === "follow_up_due") return "follow-up due";
  return value.replaceAll("_", " ");
}

function visitTypeLabelLocal(value?: string | null) {
  if (value === "recheck") return "إعادة";
  if (value === "consultation") return "استشارة";
  if (value === "urgent_kashf") return "مستعجل";
  return "كشف";
}

function paymentBadge(invoices: Invoice[], patientId: string) {
  const invoice = invoices.find((item) => item.patientId === patientId && item.status !== "paid");
  return invoice ? `Payment ${friendly(invoice.status ?? "open")}` : "No payment note";
}

function isTrainingPatient(value?: Patient | null) {
  const name = `${value?.firstName ?? ""} ${value?.lastName ?? ""}`.trim();
  const mrn = value?.medicalRecordNumber ?? "";
  return /^Demo\b/i.test(name) || /^DEMO[-_]/i.test(mrn) || /Local training/i.test(name);
}
