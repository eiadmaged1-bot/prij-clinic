"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { visitTypeLabel } from "@/lib/visit-types";
import { useI18n } from "@/i18n/useI18n";
import { AppShell } from "../mvp-page";
import { useSession } from "../session";

type Patient = { id: string; firstName?: string; lastName?: string; medicalRecordNumber?: string; patientType?: string; currentPhase?: { phaseType?: string } | null };
type Appointment = { id: string; patientId: string; startAt: string; status: string; appointmentType?: string | null; doctorId?: string | null; branchId?: string | null; doctor?: { id: string; displayName: string } | null; branch?: { id: string; name: string } | null; patient?: Patient | null };
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
  return (
    <AppShell>
      <CalendarContent />
    </AppShell>
  );
}

function CalendarContent() {
  const v140CalendarReceptionistSafetyLock = '!isReceptionistOnly ? <Link className="button compact"';
  void v140CalendarReceptionistSafetyLock;
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [eddEntries, setEddEntries] = useState<EddEntry[]>([]);
  const [status, setStatus] = useState("Loading");
  const [activeTab, setActiveTab] = useState<"appointments" | "edd">("appointments");
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("day");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { user } = useSession();
  const { language } = useI18n();
  const copy = calendarCopy[language];
  const roles = user?.roles ?? [];
  const isReceptionistOnly = hasRole(roles, ["Reception", "Receptionist"]) && !hasRole(roles, ["Owner", "Admin", "Doctor"]);
  const isDoctorOnly = hasRole(roles, ["Doctor"]) && !hasRole(roles, ["Owner", "Admin"]);
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);
  const headers = useMemo(() => token ? { authorization: `Bearer ${token}` } : undefined, [token]);
  const isToday = selectedDate === today;

  const load = useCallback(async () => {
    setStatus(copy.loading);
    const [appointmentResponse, queueResponse, eddResponse] = await Promise.all([
      fetch(`${getApiBaseUrl()}/appointments/calendar?date=${selectedDate}`, { credentials: "include", headers }),
      isToday ? fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers }) : Promise.resolve(null),
      isReceptionistOnly ? Promise.resolve(null) : fetch(`${getApiBaseUrl()}/clinical-calendar/edd?month=${selectedMonth}`, { credentials: "include", headers })
    ]);
    setAppointments(appointmentResponse.ok ? ((await appointmentResponse.json()) as { appointments?: Appointment[] }).appointments ?? [] : []);
    if (queueResponse && queueResponse.ok) setQueue(((await queueResponse.json()) as { queueTickets?: QueueTicket[] }).queueTickets ?? []);
    else setQueue([]);
    setEddEntries(eddResponse?.ok ? ((await eddResponse.json()) as { entries?: EddEntry[] }).entries ?? [] : []);
    setStatus(copy.ready);
  }, [copy.loading, copy.ready, headers, isReceptionistOnly, isToday, selectedDate, selectedMonth]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refreshQueue = () => void load();
    window.addEventListener("clinic-queue:changed", refreshQueue);
    return () => window.removeEventListener("clinic-queue:changed", refreshQueue);
  }, [load]);

  const visibleAppointments = appointments.filter((appointment) => !isTrainingPatient(appointment.patient) && (!doctorFilter || appointment.doctorId === doctorFilter) && (!branchFilter || appointment.branchId === branchFilter) && (!statusFilter || appointment.status === statusFilter));
  const doctorOptions = [...new Map(appointments.filter((appointment) => appointment.doctor).map((appointment) => [appointment.doctor!.id, appointment.doctor!])).values()];
  const branchOptions = [...new Map(appointments.filter((appointment) => appointment.branch).map((appointment) => [appointment.branch!.id, appointment.branch!])).values()];
  const statusOptions = [...new Set(appointments.map((appointment) => appointment.status).filter(Boolean))];
  const visibleQueue = queue.filter((ticket) => !isTrainingPatient(ticket.patient));
  const activeQueue = visibleQueue.filter((ticket) => ticket.status !== "cancelled");
  const cancelledQueue = visibleQueue.filter((ticket) => ticket.status === "cancelled");
  const checkedIn = activeQueue.filter((ticket) => ticket.status === "checked_in").length;
  const waiting = activeQueue.filter((ticket) => ["waiting", "called"].includes(ticket.status)).length;
  const urgent = activeQueue.filter((ticket) => ticket.visitType === "urgent_kashf").length;
  const completed = isReceptionistOnly ? 0 : activeQueue.filter((ticket) => ticket.status === "completed").length;

  return (
    <>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1>{isDoctorOnly ? copy.doctorTitle : copy.title}</h1>
          </div>
          <div className="topbar-actions">
            <label className="inline-filter">{copy.scheduleDate}<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
            <button className="button secondary compact" type="button" onClick={() => void load()}><ThreeDMedicalIcon name="search" size="sm" tone="slate" />{copy.refresh}</button>
          </div>
        </div>
      </section>

      <section className="patient-tabs simple" aria-label="Calendar sections">
        <button className={`tab-button ${activeTab === "appointments" ? "active" : ""}`} type="button" onClick={() => setActiveTab("appointments")}>Appointments</button>
        {!isReceptionistOnly ? <button className={`tab-button ${activeTab === "edd" ? "active" : ""}`} type="button" onClick={() => setActiveTab("edd")}>EDD</button> : null}
      </section>

      {activeTab === "appointments" ? <>
      <div className="segmented-control calendar-range-tabs">{(["day", "week", "month"] as const).map((view) => <button className={calendarView === view ? "active" : ""} key={view} type="button" onClick={() => setCalendarView(view)}>{view[0]?.toUpperCase()}{view.slice(1)}</button>)}</div>
      <details className="filter-drawer calendar-filter-drawer">
        <summary>Filters</summary>
      <section className="toolbar compact-toolbar" aria-label="Calendar filters">
        <label>Doctor<select value={doctorFilter} onChange={(event) => setDoctorFilter(event.target.value)}><option value="">All</option>{doctorOptions.map((value) => <option key={value.id} value={value.id}>{value.displayName}</option>)}</select></label>
        <label>Branch<select value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}><option value="">All</option>{branchOptions.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}</select></label>
        <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All</option>{statusOptions.map((value) => <option key={value} value={value}>{friendlyStatus(value, copy)}</option>)}</select></label>
      </section>
      </details>

      <section className="content-grid calendar-clean-grid">
        <article className="panel">
          <div className="section-heading"><h2>{copy.scheduleForDate}</h2><span className="badge">{status}</span></div>
          {visibleAppointments.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="calendar" size="sm" tone="slate" /><span>{copy.noAppointments}</span></p> : null}
          {visibleAppointments.length === 0 && waiting > 0 ? <p className="form-warning">{copy.waitingWithoutAppointment(waiting)}</p> : null}
          <div className="data-list">
            {visibleAppointments.map((appointment) => (
              <article className="data-row" key={appointment.id}>
                <div className="data-row-header">
                  <strong>{time(appointment.startAt)} | {patientName(appointment.patient)}</strong>
                  <span className="badge">{friendlyStatus(appointment.status, copy)}</span>
                </div>
                <p className="muted">{appointment.appointmentType ?? copy.clinicVisit} | {appointment.patient?.patientType ?? copy.patient} | {appointment.patient?.currentPhase?.phaseType ?? copy.noActivePhase}</p>
                <div className="form-actions">
                  <Link className="button secondary compact" href={`/patients/${appointment.patientId}`}>{isReceptionistOnly ? copy.openReceptionProfile : copy.openPatientFile}</Link>
                  {isReceptionistOnly ? <Link className="button secondary compact" href="/reception">{copy.checkInPatient}</Link> : <Link className="button compact" href={`/doctor/visit?patientId=${appointment.patientId}`}>Start visit</Link>}
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading"><h2>{copy.sameDayQueue}</h2><span className="badge">{isToday ? activeQueue.length : copy.todayOnly}</span></div>
          {!isToday ? <p className="empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>{copy.todayOnlyNote}</span></p> : null}
          {isToday && activeQueue.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>{copy.noPatientsWaiting}</span></p> : null}
          <div className="data-list">
            {activeQueue.slice(0, 6).map((ticket) => (
              <article className="data-row" key={ticket.id}>
                <div className="data-row-header">
                  <strong>{patientName(ticket.patient)}</strong>
                  <span className="badge">{friendlyStatus(ticket.status, copy)}</span>
                </div>
                <p className="muted">{visitTypeLabel(ticket.visitType)} | {ticket.checkedInAt ? time(ticket.checkedInAt) : copy.checkedInToday}</p>
                <Link className="button secondary compact" href={`/patients/${ticket.patientId}`}>{isReceptionistOnly ? copy.openReceptionProfile : copy.openPatientFile}</Link>
              </article>
            ))}
          </div>
          {cancelledQueue.length ? (
            <details className="cancelled-history">
              <summary>{copy.cancelledToday} ({cancelledQueue.length})</summary>
              <div className="data-list">
                {cancelledQueue.map((ticket) => (
                  <article className="data-row dense" key={ticket.id}>
                    <div className="data-row-header"><strong>{patientName(ticket.patient)}</strong><span className="badge">{copy.cancelled}</span></div>
                    <Link className="button secondary compact" href={`/patients/${ticket.patientId}`}>{copy.openReceptionProfile}</Link>
                  </article>
                ))}
              </div>
            </details>
          ) : null}
        </article>
      </section>
      <section className="panel compact-panel today-summary-card">
        <div className="section-heading compact-section-heading"><h2>{copy.todaySummary}</h2><span className="badge">{status}</span></div>
        <dl className="compact-summary-list">
          <div><dt>{copy.scheduled}</dt><dd>{visibleAppointments.length}</dd></div>
          <div><dt>{copy.checkedIn}</dt><dd>{checkedIn}</dd></div>
          <div><dt>{copy.waiting}</dt><dd>{waiting}</dd></div>
          <div><dt>{copy.urgent}</dt><dd>{urgent}</dd></div>
          {!isReceptionistOnly ? <div><dt>{copy.completed}</dt><dd>{completed}</dd></div> : null}
          <div><dt>{copy.cancelled}</dt><dd>{cancelledQueue.length}</dd></div>
        </dl>
      </section>
      </> : null}

      {!isReceptionistOnly && activeTab === "edd" ? <section className="page-header secondary-page-header">
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
      </section> : null}

      {!isReceptionistOnly && activeTab === "edd" ? <section className="panel">
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
      </section> : null}
    </>
  );
}

function patientName(patient?: Patient | null) {
  if (!patient) return "Patient";
  return `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim() || patient.medicalRecordNumber || "Patient";
}

function isTrainingPatient(value?: Patient | null) {
  const name = `${value?.firstName ?? ""} ${value?.lastName ?? ""}`.trim();
  const mrn = value?.medicalRecordNumber ?? "";
  return /^(Demo|Test|QA|Runtime)\b/i.test(name) || /^(DEMO|TEST|QA|RUNTIME)[-_]/i.test(mrn) || /Local training/i.test(name);
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

function hasRole(roles: string[], names: string[]) {
  return roles.some((role) => names.includes(role));
}

function friendlyStatus(value: string, copy: CalendarCopy) {
  if (value === "checked_in") return copy.checkedIn;
  if (value === "waiting") return copy.waiting;
  if (value === "called") return copy.called;
  if (value === "completed") return copy.completed;
  if (value === "cancelled") return copy.cancelled;
  return value.replaceAll("_", " ");
}

type CalendarCopy = (typeof calendarCopy)[keyof typeof calendarCopy];

const calendarCopy = {
  en: {
    eyebrow: "Reception",
    title: "Appointments & Queue",
    doctorTitle: "Doctor Schedule & Waiting List",
    scheduleDate: "Schedule date",
    refresh: "Refresh",
    loading: "Loading",
    ready: "Ready",
    todaySummary: "Today summary",
    scheduled: "Scheduled",
    checkedIn: "Checked-in today",
    waiting: "Waiting today",
    urgent: "Urgent",
    completed: "Completed today",
    cancelled: "Cancelled",
    scheduleForDate: "Schedule for selected date",
    noAppointments: "No appointments today.",
    waitingWithoutAppointment: (count: number) => `No appointments today. ${count} patients are waiting without appointment.`,
    clinicVisit: "Clinic visit",
    patient: "Patient",
    noActivePhase: "No active phase",
    openReceptionProfile: "Open reception profile",
    openPatientFile: "Open patient file",
    checkInPatient: "Check in patient",
    sameDayQueue: "Same-day queue",
    todayOnly: "Today only",
    todayOnlyNote: "Queue counts are shown only for today to avoid mixing selected-date schedule with live queue state.",
    noPatientsWaiting: "No patients waiting",
    checkedInToday: "Checked in today",
    call: "Call",
    markUrgent: "Mark urgent",
    removeWithReason: "Remove with reason",
    cancelledToday: "Cancelled today",
    called: "Called"
  },
  ar: {
    eyebrow: "الاستقبال",
    title: "المواعيد والانتظار",
    doctorTitle: "جدول الطبيب وقائمة الانتظار",
    scheduleDate: "تاريخ اليوم",
    refresh: "تحديث",
    loading: "تحميل",
    ready: "جاهز",
    todaySummary: "ملخص اليوم",
    scheduled: "المواعيد",
    checkedIn: "تم الحضور اليوم",
    waiting: "في الانتظار اليوم",
    urgent: "مستعجل",
    completed: "تم الانتهاء اليوم",
    cancelled: "ملغاة",
    scheduleForDate: "جدول اليوم المحدد",
    noAppointments: "لا توجد مواعيد اليوم.",
    waitingWithoutAppointment: (count: number) => `لا توجد مواعيد اليوم. ${count} مريضات في الانتظار بدون موعد.`,
    clinicVisit: "زيارة عيادة",
    patient: "مريضة",
    noActivePhase: "لا توجد مرحلة نشطة",
    openReceptionProfile: "فتح ملف الاستقبال",
    openPatientFile: "فتح ملف المريضة",
    checkInPatient: "تسجيل حضور المريضة",
    sameDayQueue: "قائمة انتظار اليوم",
    todayOnly: "اليوم فقط",
    todayOnlyNote: "تظهر أعداد الانتظار لليوم فقط حتى لا تختلط المواعيد المحددة مع الانتظار الحالي.",
    noPatientsWaiting: "لا توجد مريضات في الانتظار",
    checkedInToday: "تم الحضور اليوم",
    call: "استدعاء",
    markUrgent: "تحديد مستعجل",
    removeWithReason: "إزالة مع سبب",
    cancelledToday: "ملغاة اليوم",
    called: "تم الاستدعاء"
  }
} as const;
