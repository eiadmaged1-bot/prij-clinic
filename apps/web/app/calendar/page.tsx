"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../mvp-page";

type Patient = { id: string; firstName?: string; lastName?: string; medicalRecordNumber?: string; patientType?: string; currentPhase?: { phaseType?: string } | null };
type Appointment = { id: string; patientId: string; startAt: string; status: string; appointmentType?: string | null; patient?: Patient | null };
type QueueTicket = { id: string; patientId: string; status: string; visitType?: string | null; checkedInAt?: string | null; patient?: Patient | null };
type EddEntry = {
  patientId: string;
  patientName: string;
  medicalRecordNumber: string;
  edd: string;
  gestationalAge?: string | null;
  patientType?: string | null;
  currentPhase?: string | null;
  highRiskTags?: string[];
  status: string;
};

export default function CalendarPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [eddEntries, setEddEntries] = useState<EddEntry[]>([]);
  const [status, setStatus] = useState("Loading");
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);
  const headers = useMemo(() => token ? { authorization: `Bearer ${token}` } : undefined, [token]);
  const isToday = selectedDate === today;

  const load = useCallback(async () => {
    setStatus("Loading");
    const [appointmentResponse, queueResponse, eddResponse] = await Promise.all([
      fetch(`${getApiBaseUrl()}/appointments/calendar?date=${selectedDate}`, { credentials: "include", headers }),
      isToday ? fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers }) : Promise.resolve(null),
      fetch(`${getApiBaseUrl()}/clinical-calendar/edd?month=${selectedMonth}`, { credentials: "include", headers })
    ]);
    setAppointments(appointmentResponse.ok ? ((await appointmentResponse.json()) as { appointments?: Appointment[] }).appointments ?? [] : []);
    if (queueResponse && queueResponse.ok) setQueue(((await queueResponse.json()) as { queueTickets?: QueueTicket[] }).queueTickets ?? []);
    else setQueue([]);
    setEddEntries(eddResponse.ok ? ((await eddResponse.json()) as { entries?: EddEntry[] }).entries ?? [] : []);
    setStatus("Ready");
  }, [headers, isToday, selectedDate, selectedMonth]);

  useEffect(() => {
    void load();
  }, [load]);

  const checkedIn = queue.filter((ticket) => ticket.status === "checked_in").length;
  const waiting = queue.filter((ticket) => ["waiting", "called"].includes(ticket.status)).length;
  const completed = queue.filter((ticket) => ticket.status === "completed").length;

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Calendar</p>
            <h1>Schedule/Queue Calendar</h1>
          </div>
          <div className="topbar-actions">
            <label className="inline-filter">Schedule date<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
            <button className="button secondary compact" type="button" onClick={() => void load()}><ThreeDMedicalIcon name="search" size="sm" tone="slate" />Refresh</button>
          </div>
        </div>
      </section>

      <section className="compact-metric-grid calendar-stat-grid">
        <Metric label="Scheduled" value={appointments.length} />
        <Metric label={isToday ? "Checked-in today" : "Checked-in unavailable for date"} value={checkedIn} />
        <Metric label={isToday ? "Waiting today" : "Waiting unavailable for date"} value={waiting} />
        <Metric label={isToday ? "Completed today" : "Completed unavailable for date"} value={completed} />
      </section>

      <section className="content-grid calendar-clean-grid">
        <article className="panel">
          <div className="section-heading"><h2>Schedule for selected date</h2><span className="badge">{status}</span></div>
          {appointments.length === 0 ? (
            <p className="empty-state"><ThreeDMedicalIcon name="calendar" size="sm" tone="slate" /><span>No appointments scheduled today.</span></p>
          ) : null}
          {appointments.length === 0 && queue.length > 0 ? <p className="form-warning">Patients are waiting without appointments.</p> : null}
          <div className="data-list">
            {appointments.map((appointment) => (
              <article className="data-row" key={appointment.id}>
                <div className="data-row-header">
                  <strong>{time(appointment.startAt)} | {patientName(appointment.patient)}</strong>
                  <span className="badge">{appointment.status}</span>
                </div>
                <p className="muted">{appointment.appointmentType ?? "Clinic visit"} | {appointment.patient?.patientType ?? "Patient"} | {appointment.patient?.currentPhase?.phaseType ?? "No active phase"}</p>
                <div className="form-actions">
                  <Link className="button secondary compact" href={`/patients/${appointment.patientId}`}>Open patient file</Link>
                  <Link className="button compact" href={`/doctor/visit?patientId=${appointment.patientId}`}>Start visit</Link>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading"><h2>Same-day queue</h2><span className="badge">{isToday ? queue.length : "Today only"}</span></div>
          {!isToday ? <p className="empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>Queue counts are shown only for today to avoid mixing selected-date schedule with live queue state.</span></p> : null}
          {isToday && queue.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>No patients waiting today.</span></p> : null}
          <div className="data-list">
            {queue.map((ticket) => (
              <article className="data-row" key={ticket.id}>
                <div className="data-row-header">
                  <strong>{patientName(ticket.patient)}</strong>
                  <span className="badge">{ticket.status.replaceAll("_", " ")}</span>
                </div>
                <p className="muted">{ticket.visitType ?? "كشف"} | {ticket.checkedInAt ? time(ticket.checkedInAt) : "Checked in today"}</p>
                <Link className="button secondary compact" href={`/patients/${ticket.patientId}`}>Open patient file</Link>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="page-header secondary-page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">EDD Clinical Calendar</p>
            <h1>Expected Delivery Dates by Month</h1>
          </div>
          <div className="topbar-actions">
            <label className="inline-filter">Month<input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} /></label>
            <button className="button secondary compact" type="button" onClick={() => setSelectedMonth(today.slice(0, 7))}>EDD this month</button>
            <button className="button secondary compact" type="button" onClick={() => setSelectedMonth(nextMonth(today))}>EDD next month</button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading"><h2>Locked/reviewed EDD entries</h2><span className="badge">{eddEntries.length}</span></div>
        {eddEntries.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="pregnancy" size="sm" tone="slate" /><span>No locked or reviewed EDD records for this month.</span></p> : null}
        <div className="data-list">
          {eddEntries.map((entry) => (
            <article className="data-row" key={`${entry.patientId}-${entry.edd}`}>
              <div className="data-row-header">
                <strong>{entry.patientName} | {entry.medicalRecordNumber}</strong>
                <span className="badge">{entry.status}</span>
              </div>
              <p className="muted">EDD {entry.edd.slice(0, 10)} | {entry.gestationalAge ?? "GA not calculated"} | {entry.patientType ?? "OB"} | {entry.currentPhase ?? "pregnancy"}</p>
              {entry.highRiskTags?.length ? <p className="form-warning">High-risk tags: {entry.highRiskTags.join(", ")}</p> : null}
              <Link className="button secondary compact" href={`/patients/${entry.patientId}`}>Open patient file</Link>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <article className="mini-metric-card"><ThreeDMedicalIcon name="calendar" size="sm" /><span>{label}</span><strong>{value}</strong></article>;
}

function patientName(patient?: Patient | null) {
  if (!patient) return "Patient";
  return `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim() || patient.medicalRecordNumber || "Patient";
}

function time(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function nextMonth(today: string) {
  const date = new Date(`${today}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  return date.toISOString().slice(0, 7);
}
