"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Action, hasAnyRolePermission } from "@prij-clinic/shared";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { ActiveVisitLauncher } from "../../components/clinic/ActiveVisitWorkspace";
import { CompactKpiCard, EmptyState, PageHeader, PageShell, SectionCard } from "../../components/clinic/desktop-ui";
import { AppShell } from "../mvp-page";
import { useSession } from "../session";
import { visitTypeLabel, type VisitTypeValue } from "@/lib/visit-types";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { PatientSearchMobile } from "@/components/patients/PatientSearchMobile";

type PatientSummary = { id?: string; firstName?: string | null; lastName?: string | null; medicalRecordNumber?: string | null };
type QueueTicket = { id: string; patientId?: string; queueNumber?: number | string; status?: string; priority?: string; visitType?: VisitTypeValue | null; checkedInAt?: string | null; patient?: PatientSummary | null };
type Appointment = { id: string; patientId?: string; appointmentType?: string; status?: string; startAt?: string; patient?: PatientSummary | null };
type InvestigationResult = { id: string; patientId?: string; title?: string; reviewStatus?: string; createdAt?: string };
type PatientTask = { id: string; patientId?: string; title?: string; taskType?: string; status?: string; dueAt?: string | null };
type Encounter = { id: string; patientId?: string; status?: string; startedAt?: string; createdAt?: string; patient?: PatientSummary | null };

export default function DoctorModePage() {
  const { user } = useSession();
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [results, setResults] = useState<InvestigationResult[]>([]);
  const [tasks, setTasks] = useState<PatientTask[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    const headers = token ? { authorization: `Bearer ${token}` } : undefined;
    const endpoints = ["/queue/today", "/appointments", "/investigation-results", "/patient-tasks", "/encounters"];

    Promise.all(endpoints.map((endpoint) => fetch(`${getApiBaseUrl()}${endpoint}`, { credentials: "include", headers })))
      .then(async (responses) => {
        const [queueData, appointmentData, resultData, taskData, encounterData] = await Promise.all(responses.map(async (response) => response.ok ? response.json() : {}));
        setQueue(queueData.queueTickets ?? []);
        setAppointments(appointmentData.appointments ?? []);
        setResults(resultData.investigationResults ?? []);
        setTasks(taskData.patientTasks ?? []);
        setEncounters(encounterData.encounters ?? []);
        setLoadError(responses.some((response) => !response.ok));
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const current = queue.find((ticket) => ticket.status === "called");
  const waiting = queue.filter((ticket) => ticket.status === "waiting");
  const todayAppointments = appointments.filter((appointment) => isToday(appointment.startAt));
  const resultsToReview = results.filter((result) => result.reviewStatus === "pending_review");
  const followUpsDue = tasks.filter((task) => task.taskType === "schedule_follow_up" && ["open", "in_progress"].includes(task.status ?? "") && isDue(task.dueAt));
  const recentActivity = useMemo(() => [...encounters].sort((left, right) => activityTime(right) - activityTime(left)).slice(0, 5), [encounters]);
  const nextPatient = current ?? waiting[0];
  const nextPatientHref = nextPatient?.patientId ? `/patients/${nextPatient.patientId}` : "/doctor/waiting";
  const canStartVisit = hasAnyRolePermission(user?.roles ?? [], Action.VISIT_START) || (user?.roles ?? []).some((role) => ["Owner", "Admin", "Doctor"].includes(role));

  return (
    <AppShell>
      <PageShell className="doctor-desktop-workspace">
        <PageHeader
          eyebrow="Doctor workspace"
          title="Today’s clinical work"
          description="Current patient, waiting list, appointments, results, and follow-ups."
          actions={
            <>
              <Link className="button" href={nextPatientHref}>Open next patient</Link>
              <a className="button secondary" href="#doctor-patient-search">Find patient</a>
              {current?.patientId && canStartVisit ? <ActiveVisitLauncher className="button secondary" patientId={current.patientId}>Resume active visit</ActiveVisitLauncher> : <button className="button secondary" disabled type="button">Resume active visit</button>}
            </>
          }
        />

        {loadError ? <p className="notice" role="status">Some dashboard counts are temporarily unavailable. Existing records were not changed.</p> : null}

        <section className="compact-kpi-grid doctor-kpi-grid" aria-label="Doctor operational summary">
          {loading ? <DashboardSkeletons /> : (
            <>
              <CompactKpiCard label="Current patient" value={current ? patientName(current.patient) : "None"} detail={current ? `Queue ${current.queueNumber ?? "—"}` : "No active visit"} tone="accent" />
              <CompactKpiCard label="Waiting patients" value={waiting.length} />
              <CompactKpiCard label="Appointments today" value={todayAppointments.length} />
              <CompactKpiCard label="Results requiring review" value={resultsToReview.length} />
              <CompactKpiCard label="Follow-ups due" value={followUpsDue.length} />
            </>
          )}
        </section>

        <SectionCard title="Current patient / active visit" className="current-patient-panel" meta={<span className="badge">{current?.status ?? "None"}</span>}>
          {current ? (
            <article className="data-row dense">
              <div className="data-row-header"><strong>{patientName(current.patient)}</strong><span className="badge">{visitTypeLabel(current.visitType)}</span></div>
              <p className="muted">Queue {current.queueNumber ?? "—"} · Patient context opens before any clinical action.</p>
              <div className="form-actions">
                <Link className="button compact" href={current.patientId ? `/patients/${current.patientId}` : "/queue"}>Open patient file</Link>
                {current.patientId && canStartVisit ? <ActiveVisitLauncher className="button secondary compact" patientId={current.patientId}>Resume active visit</ActiveVisitLauncher> : null}
              </div>
            </article>
          ) : <EmptyState title="No current patient in room" description="Open the waiting list when the next patient is ready." action={<Link className="button secondary compact" href="/doctor/waiting">Open waiting list</Link>} />}
        </SectionCard>

        <section className="doctor-operational-grid">
          <SectionCard title="Waiting patients" meta={<Link className="button secondary compact" href="/doctor/waiting">Open full list</Link>}>
            <div className="doctor-list">
              {waiting.slice(0, 5).map((ticket) => (
                <Link className="doctor-row" href={ticket.patientId ? `/patients/${ticket.patientId}` : "/queue"} key={ticket.id}>
                  <ThreeDMedicalIcon name="queue" size="sm" />
                  <div><strong>{patientName(ticket.patient)}</strong><span>Queue {ticket.queueNumber ?? "—"} · {visitTypeLabel(ticket.visitType)}</span></div>
                  <span className="button compact secondary">Open</span>
                </Link>
              ))}
              {!loading && waiting.length === 0 ? <EmptyState title="No patients waiting" /> : null}
            </div>
          </SectionCard>

          <SectionCard title="Recent activity" meta={<span className="badge">Latest visits</span>}>
            <div className="dense-card-list">
              {recentActivity.map((encounter) => (
                <Link className="data-row dense" href={encounter.patientId ? `/patients/${encounter.patientId}` : "/encounters"} key={encounter.id}>
                  <div className="data-row-header"><strong>{patientName(encounter.patient)}</strong><span className="badge">{encounter.status ?? "Visit"}</span></div>
                  <span className="muted">{formatActivityDate(encounter.startedAt ?? encounter.createdAt)}</span>
                </Link>
              ))}
              {!loading && recentActivity.length === 0 ? <EmptyState title="No recent activity" description="Completed and active visits will appear here." /> : null}
            </div>
          </SectionCard>
        </section>

        <PatientSearchMobile />
      </PageShell>
    </AppShell>
  );
}

function DashboardSkeletons() {
  return <>{Array.from({ length: 5 }, (_, index) => <div className="compact-kpi-card" key={index}><div className="skeleton" aria-label="Loading dashboard count" /></div>)}</>;
}

function patientName(patient?: PatientSummary | null) {
  return [patient?.firstName, patient?.lastName].filter(Boolean).join(" ").trim() || patient?.medicalRecordNumber || "Patient";
}

function isToday(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function isDue(value?: string | null) {
  if (!value) return false;
  const due = new Date(value);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return !Number.isNaN(due.getTime()) && due <= endOfToday;
}

function activityTime(encounter: Encounter) {
  return new Date(encounter.startedAt ?? encounter.createdAt ?? 0).getTime();
}

function formatActivityDate(value?: string) {
  if (!value) return "Date not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date not recorded" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
