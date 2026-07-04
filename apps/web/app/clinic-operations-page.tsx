"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon, type IconName } from "../components/ThreeDMedicalIcon";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell, SafetyAlert } from "./mvp-page";

type Patient = { id: string; firstName?: string; lastName?: string; medicalRecordNumber?: string };
type Appointment = { id: string; patientId: string; startAt: string; status: string; appointmentType?: string | null; source?: string | null; notes?: string | null; cancellationReason?: string | null; noShowReason?: string | null; patient?: Patient };
type QueueTicket = { id: string; patientId: string; queueNumber?: number; status: string; priority?: string; patient?: Patient; appointment?: Appointment | null; cancellationReason?: string | null };
type Invoice = { id: string; patientId: string; invoiceNumber?: string; status?: string; balanceAmount?: string | number };
type InvestigationOrder = { id: string; patientId: string; status: string; priority?: string; notes?: string | null; items?: Array<{ testName?: string; category?: string; status?: string }>; patient?: Patient };

type Props = {
  mode: "calendar" | "queue" | "doctor" | "investigations" | "documents" | "reports";
  title: string;
  eyebrow: string;
  description: string;
};

export function ClinicOperationsPage({ mode, title, eyebrow, description }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<InvestigationOrder[]>([]);
  const [status, setStatus] = useState("Loading");
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);
  const headers = token ? { authorization: `Bearer ${token}` } : undefined;

  useEffect(() => { void load(); }, []);

  async function load() {
    setStatus("Loading");
    const [appointmentResponse, queueResponse, invoiceResponse, orderResponse] = await Promise.all([
      fetch(`${getApiBaseUrl()}/appointments/calendar?date=${today}`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/billing/invoices`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/investigations/orders`, { credentials: "include", headers })
    ]);
    setAppointments(appointmentResponse.ok ? ((await appointmentResponse.json()) as { appointments?: Appointment[] }).appointments ?? [] : []);
    setQueue(queueResponse.ok ? ((await queueResponse.json()) as { queueTickets?: QueueTicket[] }).queueTickets ?? [] : []);
    setInvoices(invoiceResponse.ok ? ((await invoiceResponse.json()) as { invoices?: Invoice[] }).invoices ?? [] : []);
    setOrders(orderResponse.ok ? ((await orderResponse.json()) as { investigationOrders?: InvestigationOrder[] }).investigationOrders ?? [] : []);
    setStatus("Ready");
  }

  const waiting = queue.filter((ticket) => ["waiting", "called"].includes(ticket.status));
  const completed = queue.filter((ticket) => ticket.status === "completed");
  const pendingOrders = orders.filter((order) => !["reviewed", "cancelled"].includes(order.status));

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
          </div>
          <div className="topbar-actions">
            <Link className="button compact" href="/reception/today"><ThreeDMedicalIcon name="reception" size="sm" />Reception</Link>
            <Link className="button secondary compact" href="/doctor"><ThreeDMedicalIcon name="doctor" size="sm" tone="slate" />Doctor list</Link>
            <button className="button secondary compact" type="button" onClick={load}><ThreeDMedicalIcon name="search" size="sm" tone="slate" />Refresh</button>
          </div>
        </div>
        <p className="muted">{description}</p>
      </section>
      <SafetyAlert />
      <section className="metric-grid">
        <Metric icon="calendar" label="Appointments" value={appointments.length} />
        <Metric icon="queue" label="Waiting" value={waiting.length} />
        <Metric icon="doctor" label="Completed visits" value={completed.length} />
        <Metric icon="investigations" label="Pending orders" value={pendingOrders.length} />
      </section>
      {mode === "doctor" ? <DoctorHandoff queue={waiting} orders={orders} invoices={invoices} /> : null}
      {mode === "queue" ? <QueueLoop queue={queue} invoices={invoices} /> : null}
      {mode === "calendar" ? <CalendarLoop appointments={appointments} queue={queue} invoices={invoices} /> : null}
      {mode === "investigations" ? <InvestigationLoop orders={orders} /> : null}
      {mode === "documents" ? <DocumentTimelinePlaceholder /> : null}
      {mode === "reports" ? <DailyReports appointments={appointments} queue={queue} invoices={invoices} orders={orders} status={status} /> : null}
    </AppShell>
  );
}

function Metric({ icon, label, value }: { icon: IconName; label: string; value: string | number }) {
  return <article className="metric-card"><ThreeDMedicalIcon name={icon} size="sm" /><span>{label}</span><strong>{value}</strong></article>;
}

function CalendarLoop({ appointments, queue, invoices }: { appointments: Appointment[]; queue: QueueTicket[]; invoices: Invoice[] }) {
  return <section className="content-grid"><DailyList title="Today schedule" rows={appointments.map((appointment) => row(appointment.id, appointment.patientId, `${time(appointment.startAt)} - ${patient(appointment.patient)}`, appointment.status, [appointment.appointmentType, appointment.source, appointment.notes, appointment.cancellationReason, appointment.noShowReason].filter(Boolean).join(" | "), invoices))} /><FlowPanel queue={queue} /></section>;
}

function QueueLoop({ queue, invoices }: { queue: QueueTicket[]; invoices: Invoice[] }) {
  return <section className="content-grid"><DailyList title="Queue status" rows={queue.map((ticket) => row(ticket.id, ticket.patientId, `Queue ${ticket.queueNumber ?? ""} - ${patient(ticket.patient)}`, ticket.status, [ticket.priority, ticket.appointment?.appointmentType, ticket.cancellationReason].filter(Boolean).join(" | "), invoices))} /><FlowPanel queue={queue} /></section>;
}

function DoctorHandoff({ queue, orders, invoices }: { queue: QueueTicket[]; orders: InvestigationOrder[]; invoices: Invoice[] }) {
  return <section className="content-grid"><DailyList title="Waiting for doctor" actionLabel="Start or resume visit" rows={queue.map((ticket) => row(ticket.id, ticket.patientId, patient(ticket.patient), ticket.status, [ticket.appointment?.appointmentType, `Pending orders ${orders.filter((order) => order.patientId === ticket.patientId && order.status !== "reviewed").length}`].join(" | "), invoices))} /><article className="panel"><div className="section-heading"><h2>Doctor handoff notes</h2><span className="badge">Doctor review</span></div><ul className="feature-list"><li>Open the patient workspace to start or resume the doctor visit stepper.</li><li>Visit reason, queue status, pending orders, and unpaid invoice notes are visible for workflow only.</li><li>Billing status is not a clinical blocker unless clinic policy later defines it.</li></ul></article></section>;
}

function InvestigationLoop({ orders }: { orders: InvestigationOrder[] }) {
  return <section className="content-grid"><DailyList title="Investigation handoff" rows={orders.map((order) => ({ id: order.id, patientId: order.patientId, title: `${patient(order.patient)} - ${(order.items ?? []).map((item) => item.testName).filter(Boolean).join(", ") || "Requested order"}`, status: order.status, detail: [order.priority, order.notes, (order.items ?? []).map((item) => `${item.category ?? "order"} ${item.status ?? ""}`).filter(Boolean).join(" | ")].filter(Boolean).join(" | ") }))} /><article className="panel printable-summary"><div className="section-heading"><h2>Print request</h2><button className="button secondary compact" type="button" onClick={() => window.print()}>Print requests</button></div><p className="muted">Request packets include order names and status only. Results require attachment and doctor review.</p></article></section>;
}

function DocumentTimelinePlaceholder() {
  return <section className="content-grid"><article className="panel"><div className="section-heading"><h2>Documents and results</h2><span className="badge">Metadata protected</span></div><ul className="feature-list"><li>Patient file document tabs show category, status, uploaded user, created date, and linked visit or order when available.</li><li>Local image uploads keep metadata stripping and unsafe file checks.</li><li>Normal UI hides raw storage paths and internal hashes.</li></ul></article><article className="panel"><div className="section-heading"><h2>Timeline entry types</h2><span className="badge">Patient-specific</span></div><p className="muted">Report metadata, document uploads, investigation results, and reviewed entries are consolidated inside each patient timeline.</p></article></section>;
}

function DailyReports({ appointments, queue, invoices, orders, status }: { appointments: Appointment[]; queue: QueueTicket[]; invoices: Invoice[]; orders: InvestigationOrder[]; status: string }) {
  const collected = invoices.filter((invoice) => invoice.status === "paid").length;
  return <section className="content-grid"><article className="panel"><div className="section-heading"><h2>Daily clinic summary</h2><span className="badge">{status}</span></div><dl className="profile-grid"><div><dt>Appointments</dt><dd>{appointments.length}</dd></div><div><dt>Queue waiting</dt><dd>{queue.filter((ticket) => ticket.status === "waiting").length}</dd></div><div><dt>Visits completed</dt><dd>{queue.filter((ticket) => ticket.status === "completed").length}</dd></div><div><dt>Invoices paid</dt><dd>{collected}</dd></div><div><dt>Investigations requested</dt><dd>{orders.length}</dd></div><div><dt>Pending results</dt><dd>{orders.filter((order) => order.status !== "reviewed").length}</dd></div></dl></article><article className="panel"><div className="section-heading"><h2>Role cards</h2><span className="badge">Summary only</span></div><ul className="feature-list"><li>Owner sees operational totals and manual billing notes.</li><li>Reception sees appointments, queue, check-in, and payment status notes.</li><li>Doctor sees waiting patients, visit handoff, and pending clinical orders.</li></ul></article></section>;
}

function FlowPanel({ queue }: { queue: QueueTicket[] }) {
  return <article className="panel"><div className="section-heading"><h2>Daily operations loop</h2><span className="badge">Focused</span></div><div className="workflow-band"><span>Scheduled</span><span>Checked in</span><span>Waiting</span><span>With doctor</span><span>Completed</span></div><p className="muted">Queue status badges show the handoff. Cancellation and no-show reasons are recorded when those status actions are used.</p><p className="muted">Active queue records: {queue.length}</p></article>;
}

function DailyList({ title, rows, actionLabel = "Open patient" }: { title: string; actionLabel?: string; rows: Array<{ id: string; patientId: string; title: string; status: string; detail: string; invoice?: Invoice }> }) {
  return <article className="panel"><div className="section-heading"><h2>{title}</h2><span className="badge">{rows.length}</span></div>{rows.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>No records to show.</span></p> : null}<div className="data-list">{rows.map((item) => <article className="data-row" key={item.id}><div className="data-row-header"><strong>{item.title}</strong><span className="badge">{friendly(item.status)}</span></div><p className="muted">{item.detail || "No operational note."}</p><div className="form-actions"><Link className="button secondary compact" href={`/patients/${item.patientId}`}>{actionLabel}</Link>{item.invoice ? <Link className="button secondary compact" href="/billing">{item.invoice.invoiceNumber ?? "Invoice"}: {friendly(item.invoice.status ?? "open")}</Link> : null}</div></article>)}</div></article>;
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
  return value.replaceAll("_", " ");
}
