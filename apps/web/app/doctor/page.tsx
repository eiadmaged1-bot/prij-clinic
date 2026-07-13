"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Action, hasAnyRolePermission } from "@prij-clinic/shared";
import { ThreeDMedicalIcon, type IconName } from "../../components/ThreeDMedicalIcon";
import { ActiveVisitLauncher } from "../../components/clinic/ActiveVisitWorkspace";
import { CompactKpiCard, PageHeader, PageShell } from "../../components/clinic/desktop-ui";
import { AppShell, SafetyAlert } from "../mvp-page";
import { useSession } from "../session";
import { visitTypeCounts, visitTypeLabel, type VisitTypeValue } from "@/lib/visit-types";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { DoctorQuickPatientCreate } from "@/components/patients/DoctorQuickPatientCreate";
import { PatientSearchMobile } from "@/components/patients/PatientSearchMobile";

type QueueTicket = {
  id: string;
  patientId?: string;
  queueNumber?: string;
  status?: string;
  priority?: string;
  visitType?: VisitTypeValue | null;
};

type Appointment = {
  id: string;
  patientId?: string;
  appointmentType?: string;
  status?: string;
  startAt?: string;
};

export default function DoctorModePage() {
  const { user } = useSession();
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingReports, setPendingReports] = useState<number | string>("-");
  const [status, setStatus] = useState("Loading");

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    const headers = token ? { authorization: `Bearer ${token}` } : undefined;

    Promise.all([
      fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/appointments`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/reports`, { credentials: "include", headers })
    ])
      .then(async ([queueResponse, appointmentResponse, reportsResponse]) => {
        const queueData = queueResponse.ok ? await queueResponse.json() : { queueTickets: [] };
        const appointmentData = appointmentResponse.ok ? await appointmentResponse.json() : { appointments: [] };
        const reportsData = reportsResponse.ok ? await reportsResponse.json() as { reports?: Array<{ reviewedAt?: string | null }> } : { reports: [] };
        setQueue((queueData.queueTickets ?? []).slice(0, 6));
        setAppointments((appointmentData.appointments ?? []).slice(0, 6));
        setPendingReports((reportsData.reports ?? []).filter((report) => !report.reviewedAt).length);
        setStatus("Ready");
      })
      .catch(() => setStatus("Could not load today's work"));
  }, []);

  const current = queue.find((ticket) => ticket.status === "called");
  const counts = visitTypeCounts(queue);
  const followUps = appointments.filter((appointment) => /follow|recheck/i.test(appointment.appointmentType ?? "")).length;
  const nextPatientHref = current?.patientId ? `/patients/${current.patientId}` : queue[0]?.patientId ? `/patients/${queue[0].patientId}` : "/doctor/waiting";
  const canStartVisit = hasAnyRolePermission(user?.roles ?? [], Action.VISIT_START) || (user?.roles ?? []).some((role) => ["Owner", "Admin", "Doctor"].includes(role));

  return (
    <AppShell>
      <PageShell className="doctor-desktop-workspace">
      <PageHeader eyebrow="Doctor workspace" title="Todayâ€™s clinical work" description="Current patient, waiting list, appointments, reports, and follow-ups." actions={<><Link className="button" href={nextPatientHref}>Open next patient</Link><Link className="button secondary" href="/patients">Find patient</Link><Link className="button secondary" href="/doctor/waiting">Start new visit</Link></>} />

      <section className="doctor-hero">
        <div>
          <p className="eyebrow">Doctor Mode</p>
          <h1>Today&apos;s visits, made simple</h1>
          <p className="muted">Open patient, start visit, write note, prescribe, order tests, finish, next patient.</p>
        </div>
        <div className="doctor-hero-actions">
          <a className="button large" data-action-id="patient.search" href="#doctor-patient-search"><ThreeDMedicalIcon name="patients" size="sm" />Search Patient</a>
          <a className="button secondary large" data-action-id="patient.create" href="#doctor-new-patient">New Patient</a>
          <Link className="button secondary large" href="/doctor/visit"><ThreeDMedicalIcon name="encounter" size="sm" tone="navy" />Start Visit</Link>
        </div>
      </section>

      <SafetyAlert />

      <nav className="doctor-mobile-fallback-nav" aria-label="Doctor mobile workflow">
        <a href="#doctor-today">Today</a><a href="#doctor-patient-search">Search</a><a href="#doctor-new-patient">New Patient</a><Link href="/doctor/visit">Current Visit</Link><Link href="/profile">Account</Link>
      </nav>

      <PatientSearchMobile />
      <DoctorQuickPatientCreate />

      <section className="compact-kpi-grid doctor-kpi-grid" aria-label="Doctor operational summary">
        <CompactKpiCard label="Current patient" value={current ? `Queue ${current.queueNumber ?? "â€”"}` : "None"} />
        <CompactKpiCard label="Waiting patients" value={queue.length} />
        <CompactKpiCard label="Appointments" value={appointments.length} />
        <CompactKpiCard label="Reports to review" value={pendingReports} />
        <CompactKpiCard label="Follow-ups" value={followUps} />
      </section>

      <section className="doctor-today-grid" id="doctor-today">
        <FocusCard icon="queue" eyebrow="Waiting patients" value={queue.length} text="Patients waiting or moving through the clinic flow." href="/doctor/waiting" action="Open waiting list" />
        <FocusCard icon="calendar" eyebrow="Today&apos;s patients" value={appointments.length} text="Scheduled visits for today&apos;s clinical work." href="/calendar" action="Open calendar" />
        <FocusCard icon="prescription" eyebrow="Next action" value="Write note" text="Use the doctor visit flow for large, readable steps." href="/doctor/visit" action="Open visit" />
      </section>

      <section className="panel compact-panel">
        <div className="section-heading">
          <h2>Visit type counts</h2>
          <span className="badge">Doctor waiting list</span>
        </div>
        <div className="visit-type-counts" aria-label="Doctor visit type counts">
          <span>Ã™Æ’Ã˜Â´Ã™Â {counts.kashf}</span>
          <span>Ã˜Â¥Ã˜Â¹Ã˜Â§Ã˜Â¯Ã˜Â© {counts.recheck}</span>
          <span>Ã˜Â§Ã˜Â³Ã˜ÂªÃ˜Â´Ã˜Â§Ã˜Â±Ã˜Â© {counts.consultation}</span>
          <span>Ã™â€¦Ã˜Â³Ã˜ÂªÃ˜Â¹Ã˜Â¬Ã™â€ž {counts.urgent_kashf}</span>
        </div>
      </section>

      <section className="panel compact-panel current-patient-panel">
        <div className="section-heading"><h2>Current in-room patient</h2><span className="badge">{current ? current.status : "None"}</span></div>
        {current ? (
          <article className="data-row dense">
            <div className="data-row-header"><strong>Queue {current.queueNumber ?? "patient"}</strong><span className="badge">{visitTypeLabel(current.visitType)}</span></div>
            <p className="muted">Follow-up hints and visit context stay inside the patient file.</p>
            <div className="form-actions">
              <Link className="button compact" href={current.patientId ? `/patients/${current.patientId}` : "/queue"}>Open file</Link>
              {current.patientId && canStartVisit && current.status !== "cancelled" ? <ActiveVisitLauncher className="button secondary compact" patientId={current.patientId}>Continue visit</ActiveVisitLauncher> : null}
              <Link className="button secondary compact" href="/doctor/waiting">Complete</Link>
            </div>
          </article>
        ) : (
          <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>No current patient in room.</span><Link className="button secondary compact" href="/doctor/waiting">Open doctor waiting list</Link></p>
        )}
      </section>

      <section className="panel compact-panel">
        <div className="section-heading">
          <div>
            <h2>Patients waiting for doctor</h2>
            <p className="muted">Status: {status}</p>
          </div>
          <span className="badge accent">Simple list</span>
        </div>
        <div className="doctor-list">
          {queue.length === 0 ? (
            <p className="empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>No waiting patient is loaded. Open Patients to start a visit.</span></p>
          ) : null}
          {queue.map((ticket) => (
            <Link className="doctor-row" href={ticket.patientId ? `/patients/${ticket.patientId}` : "/queue"} key={ticket.id}>
              <ThreeDMedicalIcon name="queue" size="sm" />
              <div>
                <strong>Queue {ticket.queueNumber ?? "patient"}</strong>
                <span>{ticket.status ?? "Waiting"} - {visitTypeLabel(ticket.visitType)} - open patient file first</span>
              </div>
              <span className="button compact secondary"><ThreeDMedicalIcon name="files" size="sm" tone="slate" />Open</span>
            </Link>
          ))}
        </div>
      </section>

      </PageShell>
    </AppShell>
  );
}

function FocusCard({ icon, eyebrow, value, text, href, action }: { icon: IconName; eyebrow: string; value: string | number; text: string; href: string; action: string }) {
  return (
    <article className="doctor-focus-card">
      <ThreeDMedicalIcon name={icon} size="lg" />
      <span className="eyebrow">{eyebrow}</span>
      <strong>{value}</strong>
      <p className="muted">{text}</p>
      <Link className="button compact secondary" href={href}>{action}</Link>
    </article>
  );
}
