"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { PatientPicker, patientLabel, type PatientPickerPatient } from "../../components/clinic/PatientPicker";
import { VisitTypeSelector } from "../../components/clinic/VisitTypeSelector";
import { useI18n } from "@/i18n/useI18n";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { useIdempotencyKey } from "@/lib/idempotency-key";
import { publishClinicDataChange } from "@/lib/clinic-data-events";
import { visitTypeLabel, type VisitTypeValue } from "@/lib/visit-types";
import { AppShell } from "../mvp-page";
import { receptionCopy } from "./reception-copy";
import styles from "./reception-command-center.module.css";

type QueueTicket = {
  id: string;
  patientId: string;
  queueNumber?: number | null;
  status: string;
  priority?: string | null;
  visitType?: string | null;
  checkedInAt?: string | null;
  patient?: PatientPickerPatient | null;
};

type Appointment = {
  id: string;
  patientId: string;
  startAt: string;
  endAt?: string | null;
  status: string;
  appointmentType?: string | null;
  patient?: PatientPickerPatient | null;
};

type ActionPanel = "patient" | "check-in" | "appointment";

export default function ReceptionHomePage() {
  const { language } = useI18n();
  const copy = receptionCopy[language];
  const [today] = useState(() => localDateInputValue(new Date()));
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientPickerPatient | null>(null);
  const [activePanel, setActivePanel] = useState<ActionPanel>("patient");
  const [visitType, setVisitType] = useState<VisitTypeValue | "">("");
  const [appointmentType, setAppointmentType] = useState<VisitTypeValue | "">("");
  const [appointmentDate, setAppointmentDate] = useState(() => localDateInputValue(new Date()));
  const [appointmentTime, setAppointmentTime] = useState("09:00");
  const [appointmentDuration, setAppointmentDuration] = useState(30);
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionSucceeded, setActionSucceeded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { key: checkInKey, regenerate: regenerateCheckInKey, ready: checkInReady } = useIdempotencyKey();

  const load = useCallback(async () => {
    setLoading(true);
    const token = sessionStorage.getItem("prijClinicToken");
    const headers = token ? { authorization: `Bearer ${token}` } : undefined;
    const [queueResponse, appointmentResponse] = await Promise.all([
      fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers }).catch(() => null),
      fetch(`${getApiBaseUrl()}/appointments/calendar?date=${encodeURIComponent(today)}`, { credentials: "include", headers }).catch(() => null)
    ]);

    if (queueResponse?.ok) {
      const body = await queueResponse.json() as { queueTickets?: QueueTicket[] };
      setQueue(body.queueTickets ?? []);
    }

    if (appointmentResponse?.ok) {
      const body = await appointmentResponse.json() as { appointments?: Appointment[] };
      setAppointments(body.appointments ?? []);
    }

    setLoadError(!queueResponse?.ok || !appointmentResponse?.ok);
    setLoading(false);
  }, [today]);

  useEffect(() => {
    const saved = sessionStorage.getItem("prij:reception-command:selected-patient");
    if (!saved) return;
    try {
      setSelectedPatient(JSON.parse(saved) as PatientPickerPatient);
    } catch {
      sessionStorage.removeItem("prij:reception-command:selected-patient");
    }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener("clinic-queue:changed", refresh);
    return () => window.removeEventListener("clinic-queue:changed", refresh);
  }, [load]);

  function selectPatient(patient: PatientPickerPatient | null) {
    setSelectedPatient(patient);
    setActionMessage("");
    setActionSucceeded(false);
    if (patient) sessionStorage.setItem("prij:reception-command:selected-patient", JSON.stringify(patient));
    else sessionStorage.removeItem("prij:reception-command:selected-patient");
  }

  const visibleQueue = useMemo(() => queue.filter((ticket) => !isTrainingPatient(ticket.patient)), [queue]);
  const visibleAppointments = useMemo(
    () => appointments.filter((appointment) => !isTrainingPatient(appointment.patient)).sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime()),
    [appointments]
  );
  const checkedIn = visibleQueue.filter((ticket) => normalizeStatus(ticket.status) === "checked_in");
  const waiting = visibleQueue.filter((ticket) => normalizeStatus(ticket.status) === "waiting");
  const called = visibleQueue.filter((ticket) => normalizeStatus(ticket.status) === "called");
  const urgent = visibleQueue.filter((ticket) => ["checked_in", "waiting", "called"].includes(normalizeStatus(ticket.status)) && (ticket.priority === "priority" || ticket.visitType === "urgent_kashf"));
  const activeQueue = visibleQueue.filter((ticket) => !["cancelled", "completed"].includes(normalizeStatus(ticket.status)));
  const nextPatient = called[0] ?? urgent.find((ticket) => normalizeStatus(ticket.status) === "waiting") ?? waiting[0] ?? checkedIn[0] ?? null;
  const selectedQueueTicket = selectedPatient ? activeQueue.find((ticket) => ticket.patientId === selectedPatient.id) ?? null : null;
  const selectedAppointment = selectedPatient ? visibleAppointments.find((appointment) => appointment.patientId === selectedPatient.id && !["cancelled", "no_show"].includes(normalizeStatus(appointment.status))) ?? null : null;

  function chooseAction(panel: ActionPanel) {
    setActivePanel(panel);
    setActionMessage("");
    setActionSucceeded(false);
  }

  async function checkInPatient() {
    if (!selectedPatient) {
      setActionMessage(copy.selectPatientFirst);
      setActionSucceeded(false);
      return;
    }
    if (!visitType) {
      setActionMessage(copy.visitTypeRequired);
      setActionSucceeded(false);
      return;
    }
    if (!checkInReady || submitting) return;

    setSubmitting(true);
    setActionMessage(copy.addingToWaiting);
    setActionSucceeded(false);
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/queue/check-in`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "idempotency-key": checkInKey,
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        patientId: selectedPatient.id,
        visitType,
        priority: visitType === "urgent_kashf" ? "priority" : "routine",
        checkInMethod: "Reception Command Center"
      })
    }).catch(() => null);

    const body = response?.ok ? await response.json().catch(() => null) as { alreadyQueued?: boolean } | null : null;
    if (response?.ok) {
      setActionSucceeded(true);
      setActionMessage(body?.alreadyQueued ? copy.alreadyWaiting : copy.addedToWaiting);
      regenerateCheckInKey();
      publishClinicDataChange(["queue", "patient", "timeline", "owner-operations"], selectedPatient.id);
      await load();
    } else {
      setActionMessage(copy.queueUpdateFailed);
    }
    setSubmitting(false);
  }

  async function scheduleAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPatient) {
      setActionMessage(copy.selectPatientFirst);
      setActionSucceeded(false);
      return;
    }
    if (!appointmentType) {
      setActionMessage(copy.visitTypeRequired);
      setActionSucceeded(false);
      return;
    }

    const start = new Date(`${appointmentDate}T${appointmentTime}:00`);
    if (Number.isNaN(start.getTime())) {
      setActionMessage(copy.invalidAppointmentTime);
      setActionSucceeded(false);
      return;
    }
    const end = new Date(start.getTime() + appointmentDuration * 60_000);

    setSubmitting(true);
    setActionMessage(copy.schedulingAppointment);
    setActionSucceeded(false);
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/appointments`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        patientId: selectedPatient.id,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        appointmentType,
        source: "Reception Command Center",
        notes: appointmentNotes.trim() || undefined
      })
    }).catch(() => null);

    if (response?.ok) {
      setActionSucceeded(true);
      setActionMessage(copy.appointmentSaved);
      setAppointmentNotes("");
      publishClinicDataChange(["appointments", "patient", "timeline", "owner-operations"], selectedPatient.id);
      await load();
    } else {
      setActionMessage(copy.appointmentFailed);
    }
    setSubmitting(false);
  }

  return (
    <AppShell>
      <div className={styles.commandCenter}>
        <section className={`page-header ${styles.header}`}>
          <div className="header-row">
            <div className={styles.headerCopy}>
              <p className="eyebrow">{copy.eyebrow}</p>
              <h1>{copy.title}</h1>
              <p className="muted">{copy.subtitle}</p>
            </div>
            <div className="topbar-actions">
              <span className="badge">{formatDate(today, language)}</span>
              <button className="button secondary compact" type="button" onClick={() => void load()}>
                <ThreeDMedicalIcon name="search" size="sm" tone="slate" />
                {copy.refresh}
              </button>
            </div>
          </div>
        </section>

        {loadError ? <p className="notice" role="status">{copy.partialData}</p> : null}

        <section aria-label={copy.todayFlow} className={styles.metrics}>
          <Metric label={copy.appointments} value={visibleAppointments.length} detail={copy.scheduled} icon="calendar" />
          <Metric label={copy.checkedIn} value={checkedIn.length} detail={copy.checkedInStatus} icon="reception" />
          <Metric label={copy.waiting} value={waiting.length + called.length} detail={copy.waitingStatus} icon="queue" />
          <Metric label={copy.urgent} value={urgent.length} detail={copy.urgent} icon="doctor" />
        </section>

        <section className={styles.quickActions} aria-label={copy.patientActions}>
          <button className={`${styles.quickAction} ${activePanel === "patient" ? styles.quickActionActive : ""}`} type="button" onClick={() => chooseAction("patient")}>
            <ThreeDMedicalIcon name="search" size="sm" />
            <span>{copy.findPatient}</span>
          </button>
          <Link className={styles.quickAction} href="/patients/new">
            <ThreeDMedicalIcon name="patients" size="sm" />
            <span>{copy.newPatient}</span>
          </Link>
          <button className={`${styles.quickAction} ${activePanel === "check-in" ? styles.quickActionActive : ""}`} type="button" onClick={() => chooseAction("check-in")}>
            <ThreeDMedicalIcon name="reception" size="sm" />
            <span>{copy.checkIn}</span>
          </button>
          <button className={`${styles.quickAction} ${activePanel === "appointment" ? styles.quickActionActive : ""}`} type="button" onClick={() => chooseAction("appointment")}>
            <ThreeDMedicalIcon name="calendar" size="sm" />
            <span>{copy.bookAppointment}</span>
          </button>
          <Link className={styles.quickAction} href="/queue">
            <ThreeDMedicalIcon name="queue" size="sm" />
            <span>{copy.openQueue}</span>
          </Link>
        </section>

        <section className={styles.workspaceGrid}>
          <article className={`panel ${styles.patientPanel}`}>
            <div className="section-heading">
              <div>
                <h2>{copy.patientContext}</h2>
                <p className="muted">{copy.patientContextHelp}</p>
              </div>
              <span className="badge">{copy.branchScoped}</span>
            </div>
            <PatientPicker
              patients={selectedPatient ? [selectedPatient] : []}
              selectedPatientId={selectedPatient?.id ?? ""}
              onSelect={(id) => { if (!id) selectPatient(null); }}
              onPatientSelect={selectPatient}
              required
              label={copy.findPatient}
              storageKey="reception-command"
            />
          </article>

          <article className={`panel ${styles.actionPanel}`}>
            <div className="section-heading">
              <div>
                <h2>{copy.patientActions}</h2>
                <p className="muted">{selectedPatient ? patientLabel(selectedPatient) : copy.selectPatientFirst}</p>
              </div>
              {selectedPatient ? <span className="badge accent">{copy.selectedPatient}</span> : null}
            </div>

            {selectedPatient ? (
              <>
                <div className={styles.selectedSignals}>
                  <Signal label={copy.status} value={selectedQueueTicket ? queueStatusLabel(selectedQueueTicket.status, language, copy) : copy.noPatientWaiting} />
                  <Signal label={copy.appointments} value={selectedAppointment ? `${formatTime(selectedAppointment.startAt, language)} · ${appointmentStatusLabel(selectedAppointment.status, language, copy)}` : copy.noAppointments} />
                </div>
                <div className={styles.patientActions}>
                  <Link className="button secondary compact" href={`/patients/${encodeURIComponent(selectedPatient.id)}`}>{copy.openProfile}</Link>
                  <Link className="button secondary compact" href="/reception/qr-scan">{copy.permanentQr}</Link>
                  <button className="button secondary compact" type="button" onClick={() => selectPatient(null)}>{copy.clearSelection}</button>
                </div>
              </>
            ) : <div className={styles.actionEmpty}>{copy.selectPatientFirst}</div>}

            {activePanel === "check-in" ? (
              <section className={styles.inlineForm} aria-label={copy.checkIn}>
                <VisitTypeSelector value={visitType} onChange={setVisitType} compact />
                <div className={styles.formActions}>
                  <button className="button" type="button" disabled={!selectedPatient || !visitType || !checkInReady || submitting} onClick={() => void checkInPatient()}>
                    <ThreeDMedicalIcon name="queue" size="sm" />
                    {submitting ? copy.addingToWaiting : copy.addToWaiting}
                  </button>
                  <Link className="button secondary" href="/reception/check-in">{copy.openQueue}</Link>
                </div>
              </section>
            ) : null}

            {activePanel === "appointment" ? (
              <form className={styles.inlineForm} onSubmit={scheduleAppointment}>
                <VisitTypeSelector value={appointmentType} onChange={setAppointmentType} compact />
                <div className={styles.quickDateRow}>
                  <button className={`${styles.choiceButton} ${appointmentDate === today ? styles.choiceButtonActive : ""}`} type="button" onClick={() => setAppointmentDate(today)}>{copy.today}</button>
                  <button className={`${styles.choiceButton} ${appointmentDate === tomorrowValue(today) ? styles.choiceButtonActive : ""}`} type="button" onClick={() => setAppointmentDate(tomorrowValue(today))}>{copy.tomorrow}</button>
                </div>
                <div className={styles.formGrid}>
                  <label>{copy.appointmentDate}<input type="date" min={today} required value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} /></label>
                  <label>{copy.appointmentTime}<input type="time" required value={appointmentTime} onChange={(event) => setAppointmentTime(event.target.value)} /></label>
                  <div className={styles.formWide}>
                    <span className="muted">{copy.appointmentDuration}</span>
                    <div className={styles.durationRow}>
                      {[15, 30, 45, 60].map((duration) => <button className={`${styles.choiceButton} ${appointmentDuration === duration ? styles.choiceButtonActive : ""}`} key={duration} type="button" onClick={() => setAppointmentDuration(duration)}>{duration} {copy.durationMinutes}</button>)}
                    </div>
                  </div>
                  <label className={styles.formWide}>{copy.appointmentNotes}<input maxLength={500} value={appointmentNotes} onChange={(event) => setAppointmentNotes(event.target.value)} /></label>
                </div>
                <div className={styles.formActions}>
                  <button className="button" type="submit" disabled={!selectedPatient || !appointmentType || submitting}>
                    <ThreeDMedicalIcon name="calendar" size="sm" />
                    {submitting ? copy.schedulingAppointment : copy.scheduleAppointment}
                  </button>
                  <Link className="button secondary" href="/calendar">{copy.todayAppointments}</Link>
                </div>
              </form>
            ) : null}

            {actionMessage ? <p className={`${styles.statusMessage} ${actionSucceeded ? styles.statusSuccess : ""}`} role="status">{actionMessage}</p> : null}
          </article>
        </section>

        <section className={styles.flowGrid}>
          <article className={`panel ${styles.listPanel}`}>
            <div className="section-heading"><h2>{copy.todayAppointments}</h2><span className="badge">{visibleAppointments.length}</span></div>
            {loading ? <div className={`skeleton ${styles.loading}`} /> : null}
            {!loading && visibleAppointments.length === 0 ? <div className={styles.empty}>{copy.noAppointments}</div> : null}
            <div className={styles.list}>
              {visibleAppointments.slice(0, 8).map((appointment) => (
                <article className={styles.listRow} key={appointment.id}>
                  <div className={styles.rowMain}>
                    <strong>{patientLabel(appointment.patient)}</strong>
                    <div className={styles.rowMeta}>
                      <span>{formatTime(appointment.startAt, language)}</span>
                      <span>{visitTypeLabel(appointment.appointmentType)}</span>
                      <span>{appointmentStatusLabel(appointment.status, language, copy)}</span>
                    </div>
                  </div>
                  <div className={styles.rowActions}>
                    {appointment.patient ? <button className="button secondary compact" type="button" onClick={() => { selectPatient(appointment.patient ?? null); chooseAction("check-in"); }}>{copy.select}</button> : null}
                  </div>
                </article>
              ))}
            </div>
            <Link className="button secondary compact" href="/calendar">{copy.todayAppointments}</Link>
          </article>

          <article className={`panel ${styles.listPanel}`}>
            <div className="section-heading"><h2>{copy.liveWaitingLine}</h2><span className="badge">{activeQueue.length}</span></div>
            <div className={styles.nextPatient}>
              <span>{copy.nextToDoctor}</span>
              <strong>{nextPatient ? patientLabel(nextPatient.patient) : copy.noPatientWaiting}</strong>
            </div>
            {loading ? <div className={`skeleton ${styles.loading}`} /> : null}
            {!loading && activeQueue.length === 0 ? <div className={styles.empty}>{copy.noQueue}</div> : null}
            <div className={styles.list}>
              {sortQueue(activeQueue).slice(0, 8).map((ticket) => (
                <article className={styles.listRow} key={ticket.id}>
                  <div className={styles.rowMain}>
                    <strong>{patientLabel(ticket.patient)}</strong>
                    <div className={styles.rowMeta}>
                      <span>{copy.queueNumber} {ticket.queueNumber ?? "—"}</span>
                      <span>{visitTypeLabel(ticket.visitType)}</span>
                      <span>{queueStatusLabel(ticket.status, language, copy)}</span>
                      {ticket.checkedInAt ? <span>{waitingDuration(ticket.checkedInAt, language)}</span> : null}
                    </div>
                  </div>
                  <div className={styles.rowActions}>
                    {ticket.patient ? <button className="button secondary compact" type="button" onClick={() => selectPatient(ticket.patient ?? null)}>{copy.select}</button> : null}
                  </div>
                </article>
              ))}
            </div>
            <Link className="button secondary compact" href="/queue">{copy.openQueue}</Link>
          </article>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, detail, icon }: { label: string; value: number; detail: string; icon: "calendar" | "reception" | "queue" | "doctor" }) {
  return <article className={styles.metric}><ThreeDMedicalIcon name={icon} size="sm" /><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function Signal({ label, value }: { label: string; value: string }) {
  return <div className={styles.signal}><span>{label}</span><strong>{value}</strong></div>;
}

function normalizeStatus(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function queueStatusLabel(value: string, language: "en" | "ar", copy: typeof receptionCopy.en | typeof receptionCopy.ar) {
  const status = normalizeStatus(value);
  if (status === "waiting") return copy.waitingStatus;
  if (status === "checked_in") return copy.checkedInStatus;
  if (status === "called") return copy.called;
  if (status === "completed") return copy.completed;
  if (status === "cancelled") return copy.cancelled;
  return language === "ar" ? status.replaceAll("_", " ") : status.replaceAll("_", " ");
}

function appointmentStatusLabel(value: string, language: "en" | "ar", copy: typeof receptionCopy.en | typeof receptionCopy.ar) {
  const status = normalizeStatus(value);
  if (status === "scheduled") return copy.scheduled;
  if (status === "checked_in") return copy.checkedInStatus;
  if (status === "completed") return copy.completed;
  if (status === "cancelled") return copy.cancelled;
  return language === "ar" ? status.replaceAll("_", " ") : status.replaceAll("_", " ");
}

function formatTime(value: string, language: "en" | "ar") {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString(language === "ar" ? "ar-EG" : "en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(value: string, language: "en" | "ar") {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function waitingDuration(value: string, language: "en" | "ar") {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (language === "ar") return minutes < 60 ? `${minutes} دقيقة` : `${Math.floor(minutes / 60)} س ${minutes % 60} د`;
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function sortQueue(rows: QueueTicket[]) {
  return [...rows].sort((left, right) => urgentRank(right) - urgentRank(left) || new Date(left.checkedInAt ?? 0).getTime() - new Date(right.checkedInAt ?? 0).getTime());
}

function urgentRank(ticket: QueueTicket) {
  return ticket.priority === "priority" || ticket.visitType === "urgent_kashf" ? 1 : 0;
}

function isTrainingPatient(patient?: PatientPickerPatient | null) {
  const name = `${patient?.firstName ?? ""} ${patient?.lastName ?? ""}`.trim();
  const mrn = patient?.medicalRecordNumber ?? "";
  return /^(Demo|Test|QA|Runtime)\b/i.test(name) || /^(DEMO|TEST|QA|RUNTIME)[-_]/i.test(mrn) || /Local training/i.test(name);
}

function localDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function tomorrowValue(today: string) {
  const date = new Date(`${today}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return localDateInputValue(date);
}
