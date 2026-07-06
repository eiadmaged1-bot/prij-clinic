"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../../mvp-page";

type Patient = { id: string; medicalRecordNumber?: string; firstName?: string; lastName?: string; phone?: string | null };
type Appointment = { id: string; patientId: string; startAt: string; status: string; appointmentType?: string | null; patient?: Patient };
type QueueTicket = { id: string; patientId: string; queueNumber?: number; status: string; priority?: string; visitType?: string | null; checkedInAt?: string | null; patient?: Patient; appointment?: Appointment | null };
type InvestigationOrder = { id: string; patientId: string; status: string; priority?: string; patient?: Patient; createdAt?: string };
type DeskTab = "waiting" | "with-doctor" | "completed" | "appointments" | "pending-results";

export default function ReceptionTodayPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [orders, setOrders] = useState<InvestigationOrder[]>([]);
  const [status, setStatus] = useState("Loading");
  const [tab, setTab] = useState<DeskTab>("waiting");
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);
  const headers = useMemo(() => token ? { authorization: `Bearer ${token}` } : undefined, [token]);

  const load = useCallback(async () => {
    setStatus("Loading");
    const [appointmentResponse, queueResponse, orderResponse] = await Promise.all([
      fetch(`${getApiBaseUrl()}/appointments/calendar?date=${today}`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/investigations/orders`, { credentials: "include", headers })
    ]);
    setAppointments(appointmentResponse.ok ? ((await appointmentResponse.json()) as { appointments?: Appointment[] }).appointments ?? [] : []);
    setQueue(queueResponse.ok ? ((await queueResponse.json()) as { queueTickets?: QueueTicket[] }).queueTickets ?? [] : []);
    setOrders(orderResponse.ok ? ((await orderResponse.json()) as { investigationOrders?: InvestigationOrder[] }).investigationOrders ?? [] : []);
    setStatus("Ready");
  }, [headers, today]);

  useEffect(() => {
    void load();
  }, [load]);

  const waiting = queue.filter((ticket) => ticket.status === "waiting");
  const withDoctor = queue.filter((ticket) => ticket.status === "called" || ticket.status === "with_doctor");
  const completed = queue.filter((ticket) => ticket.status === "completed");
  const pendingResults = orders.filter((order) => !["reviewed", "completed", "cancelled"].includes(order.status));
  const next = waiting[0] ?? withDoctor[0] ?? null;
  const rows = rowsFor(tab, { waiting, withDoctor, completed, appointments, pendingResults });

  return (
    <AppShell>
      <section className="page-header compact-workspace-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Reception</p>
            <h1>Today&apos;s Desk</h1>
          </div>
          <div className="topbar-actions">
            <Link className="button compact" href="/patients/new"><ThreeDMedicalIcon name="patients" size="sm" />New Patient</Link>
            <Link className="button secondary compact" href="/reception/check-in"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" />Returning Patient</Link>
            <button className="button secondary compact icon-only-button" type="button" onClick={load} aria-label="Refresh Today&apos;s Desk"><ThreeDMedicalIcon name="search" size="sm" tone="slate" /></button>
          </div>
        </div>
      </section>

      <section className="compact-metric-grid">
        <Metric label="Next" value={next ? patientLabel(next.patient) : "None"} />
        <Metric label="Waiting" value={waiting.length} />
        <Metric label="With doctor" value={withDoctor.length} />
        <Metric label="Completed" value={completed.length} />
      </section>

      <section className="panel compact-panel today-desk-board">
        <div className="section-heading">
          <h2>Board</h2>
          <span className="badge">{status}</span>
        </div>
        <div className="segmented-control compact-tabs" role="tablist" aria-label="Today desk tabs">
          {[
            ["waiting", "Waiting"],
            ["with-doctor", "With doctor"],
            ["completed", "Completed"],
            ["appointments", "Appointments"],
            ["pending-results", "Pending results"]
          ].map(([key, label]) => (
            <button className={tab === key ? "active" : ""} key={key} type="button" onClick={() => setTab(key as DeskTab)}>{label}</button>
          ))}
        </div>
        <div className="dense-card-list">
          {rows.map((row) => (
            <article className="data-row dense compact-desk-row" key={row.id}>
              <span>{row.time}</span>
              <strong>{row.patientName}</strong>
              <span>{row.visitType}</span>
              <span className="badge">{row.status}</span>
              <Link className="button secondary compact" href={`/patients/${row.patientId}`}>Open</Link>
            </article>
          ))}
          {!rows.length ? <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>No rows in this view.</span></p> : null}
        </div>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <article className="mini-metric-card"><span>{label}</span><strong>{value}</strong></article>;
}

function rowsFor(tab: DeskTab, input: { waiting: QueueTicket[]; withDoctor: QueueTicket[]; completed: QueueTicket[]; appointments: Appointment[]; pendingResults: InvestigationOrder[] }) {
  if (tab === "appointments") {
    return input.appointments.map((appointment) => ({
      id: appointment.id,
      patientId: appointment.patientId,
      time: time(appointment.startAt),
      patientName: patientLabel(appointment.patient),
      visitType: appointment.appointmentType || "Visit",
      status: friendly(appointment.status)
    }));
  }
  if (tab === "pending-results") {
    return input.pendingResults.map((order) => ({
      id: order.id,
      patientId: order.patientId,
      time: order.createdAt ? time(order.createdAt) : "Today",
      patientName: patientLabel(order.patient),
      visitType: "Investigation",
      status: friendly(order.status)
    }));
  }
  const source = tab === "with-doctor" ? input.withDoctor : tab === "completed" ? input.completed : input.waiting;
  return source.map((ticket) => ({
    id: ticket.id,
    patientId: ticket.patientId,
    time: ticket.checkedInAt ? time(ticket.checkedInAt) : `Queue ${ticket.queueNumber ?? ""}`.trim(),
    patientName: patientLabel(ticket.patient),
    visitType: visitTypeLabel(ticket.visitType),
    status: friendly(ticket.status)
  }));
}

function patientLabel(patient?: Patient | null) {
  if (!patient) return "Patient";
  return `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim() || patient.medicalRecordNumber || "Patient";
}

function visitTypeLabel(value?: string | null) {
  if (value === "recheck") return "إعادة";
  if (value === "consultation") return "استشارة";
  if (value === "urgent_kashf") return "مستعجل";
  return "كشف";
}

function friendly(value: string) {
  if (value === "called") return "with doctor";
  if (value === "checked_in") return "checked-in";
  if (value === "follow_up_due") return "follow-up due";
  return value.replaceAll("_", " ");
}

function time(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
