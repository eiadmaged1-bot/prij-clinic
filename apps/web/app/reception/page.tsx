"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { ReceptionMobileHomeLink } from "../../components/layout/ReceptionMobileHomeLink";
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

export default function ReceptionHomePage() {
  const { language } = useI18n();
  const copy = receptionCopy[language];
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientPickerPatient | null>(null);
  const [visitType, setVisitType] = useState<VisitTypeValue | "">("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionSucceeded, setActionSucceeded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { key: checkInKey, regenerate: regenerateCheckInKey, ready: checkInReady } = useIdempotencyKey();

  const loadQueue = useCallback(async () => {
    setLoading(true);
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/queue/today`, {
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    }).catch(() => null);

    if (response?.ok) {
      const body = await response.json() as { queueTickets?: QueueTicket[] };
      setQueue(body.queueTickets ?? []);
      setLoadError(false);
    } else {
      setLoadError(true);
    }
    setLoading(false);
  }, []);

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
    void loadQueue();
    const refresh = () => void loadQueue();
    window.addEventListener("clinic-queue:changed", refresh);
    return () => window.removeEventListener("clinic-queue:changed", refresh);
  }, [loadQueue]);

  function selectPatient(patient: PatientPickerPatient | null) {
    setSelectedPatient(patient);
    setActionMessage("");
    setActionSucceeded(false);
    if (patient) sessionStorage.setItem("prij:reception-command:selected-patient", JSON.stringify(patient));
    else sessionStorage.removeItem("prij:reception-command:selected-patient");
  }

  const visibleQueue = useMemo(() => queue.filter((ticket) => !isTrainingPatient(ticket.patient)), [queue]);
  const checkedIn = visibleQueue.filter((ticket) => normalizeStatus(ticket.status) === "checked_in");
  const waiting = visibleQueue.filter((ticket) => normalizeStatus(ticket.status) === "waiting");
  const called = visibleQueue.filter((ticket) => normalizeStatus(ticket.status) === "called");
  const urgent = visibleQueue.filter((ticket) => ["checked_in", "waiting", "called"].includes(normalizeStatus(ticket.status)) && (ticket.priority === "priority" || ticket.visitType === "urgent_kashf"));
  const activeQueue = visibleQueue.filter((ticket) => !["cancelled", "completed"].includes(normalizeStatus(ticket.status)));
  const sortedActiveQueue = sortQueue(activeQueue);
  const nextPatient = called[0] ?? urgent.find((ticket) => normalizeStatus(ticket.status) === "waiting") ?? waiting[0] ?? checkedIn[0] ?? null;
  const selectedQueueTicket = selectedPatient ? activeQueue.find((ticket) => ticket.patientId === selectedPatient.id) ?? null : null;

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
      await loadQueue();
    } else {
      setActionMessage(copy.queueUpdateFailed);
    }
    setSubmitting(false);
  }

  function focusCheckIn() {
    document.getElementById("reception-check-in")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const mobileTitle = language === "ar" ? "الرئيسية — الاستقبال" : "Reception Home";
  const liveQueueTitle = language === "ar" ? "قائمة الانتظار المباشرة" : "Live queue";

  return (
    <AppShell>
      <ReceptionMobileHomeLink />
      <div className={styles.commandCenter}>
        <section className={`${styles.mobileReception} ${styles.mobileOnly}`}>
          <section className="page-header">
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1>{mobileTitle}</h1>
          </section>

          <section className={styles.mobileScoreboard} aria-label={copy.todayFlow}>
            <article className={styles.mobileScoreCard}>
              <ThreeDMedicalIcon name="queue" size="sm" />
              <span>{copy.waiting}</span>
              <strong>{waiting.length + called.length}</strong>
            </article>
            <article className={`${styles.mobileScoreCard} ${styles.mobileUrgentScore}`}>
              <ThreeDMedicalIcon name="doctor" size="sm" />
              <span>{copy.urgent}</span>
              <strong>{urgent.length}</strong>
            </article>
          </section>

          <section className={styles.mobileActions} aria-label={copy.patientActions}>
            <Link className={styles.mobileActionCard} href="/reception/check-in">
              <ThreeDMedicalIcon name="reception" size="sm" />
              <span>{copy.checkIn}</span>
            </Link>
            <Link className={styles.mobileActionCard} href="/patients/new">
              <ThreeDMedicalIcon name="patients" size="sm" />
              <span>{copy.newPatient}</span>
            </Link>
          </section>

          <section className={`panel compact-panel ${styles.mobileQueuePreview}`} aria-label={copy.queuePreview}>
            <div className="section-heading">
              <div>
                <h2>{liveQueueTitle}</h2>
                <p className="muted">{copy.nextPatient}: {nextPatient ? patientLabel(nextPatient.patient) : copy.noPatientWaiting}</p>
              </div>
              <button className="button secondary compact" type="button" onClick={() => void loadQueue()}>{copy.refresh}</button>
            </div>
            {loadError ? <p className="notice" role="status">{copy.partialData}</p> : null}
            {loading ? <div className={`skeleton ${styles.loading}`} /> : null}
            {!loading && sortedActiveQueue.length === 0 ? <div className={styles.empty}>{copy.noQueue}</div> : null}
            <div className={styles.mobileQueueList}>
              {sortedActiveQueue.slice(0, 6).map((ticket) => (
                <article className={styles.mobileQueueRow} key={ticket.id}>
                  <span className={styles.mobileQueueNumber}>{ticket.queueNumber ?? "—"}</span>
                  <div>
                    <strong>{patientLabel(ticket.patient)}</strong>
                    <p>{visitTypeLabel(ticket.visitType)} · {queueStatusLabel(ticket.status, copy)}</p>
                  </div>
                  {urgentRank(ticket) ? <span className={styles.mobileUrgentBadge}>{copy.urgent}</span> : null}
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className={styles.desktopOnly}>
          <section className={`page-header ${styles.header}`}>
            <div className="header-row">
              <div className={styles.headerCopy}>
                <p className="eyebrow">{copy.eyebrow}</p>
                <h1>{copy.title}</h1>
                <p className="muted">{copy.subtitle}</p>
              </div>
              <div className="topbar-actions">
                <button className="button secondary compact" type="button" onClick={() => void loadQueue()}>
                  <ThreeDMedicalIcon name="queue" size="sm" tone="slate" />
                  {copy.refresh}
                </button>
              </div>
            </div>
          </section>

          {loadError ? <p className="notice" role="status">{copy.partialData}</p> : null}

          <section aria-label={copy.todayFlow} className={styles.metrics}>
            <Metric label={copy.waiting} value={waiting.length + called.length} detail={copy.waitingStatus} icon="queue" />
            <Metric label={copy.urgent} value={urgent.length} detail={copy.urgent} icon="doctor" />
          </section>

          <section className={styles.quickActions} aria-label={copy.patientActions}>
            <Link className={styles.quickAction} href="/patients/new">
              <ThreeDMedicalIcon name="patients" size="sm" />
              <span>{copy.newPatient}</span>
            </Link>
            <button className={`${styles.quickAction} ${styles.quickActionActive}`} type="button" onClick={focusCheckIn}>
              <ThreeDMedicalIcon name="reception" size="sm" />
              <span>{copy.checkIn}</span>
            </button>
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

            <article className={`panel ${styles.actionPanel}`} id="reception-check-in">
              <div className="section-heading">
                <div>
                  <h2>{copy.checkIn}</h2>
                  <p className="muted">{selectedPatient ? patientLabel(selectedPatient) : copy.selectPatientFirst}</p>
                </div>
                {selectedPatient ? <span className="badge accent">{copy.selectedPatient}</span> : null}
              </div>

              {selectedPatient ? (
                <>
                  <div className={styles.selectedSignals}>
                    <Signal label={copy.status} value={selectedQueueTicket ? queueStatusLabel(selectedQueueTicket.status, copy) : copy.noPatientWaiting} />
                  </div>
                  <div className={styles.patientActions}>
                    <Link className="button secondary compact" href={`/patients/${encodeURIComponent(selectedPatient.id)}`}>{copy.openProfile}</Link>
                    <button className="button secondary compact" type="button" onClick={() => selectPatient(null)}>{copy.clearSelection}</button>
                  </div>
                </>
              ) : <p className={styles.selectionHint}>{copy.selectPatientFirst}</p>}

              <section className={styles.inlineForm} aria-label={copy.checkIn}>
                <VisitTypeSelector value={visitType} onChange={setVisitType} compact />
                <div className={styles.formActions}>
                  <button className="button" type="button" disabled={!selectedPatient || !visitType || !checkInReady || submitting} onClick={() => void checkInPatient()}>
                    <ThreeDMedicalIcon name="queue" size="sm" />
                    {submitting ? copy.addingToWaiting : copy.addToWaiting}
                  </button>
                </div>
              </section>

              {actionMessage ? <p className={`${styles.statusMessage} ${actionSucceeded ? styles.statusSuccess : ""}`} role="status">{actionMessage}</p> : null}
            </article>
          </section>

          <section className={`panel ${styles.listPanel}`}>
            <div className="section-heading"><h2>{copy.liveWaitingLine}</h2><span className="badge">{activeQueue.length}</span></div>
            <div className={styles.nextPatient}>
              <span>{copy.nextToDoctor}</span>
              <strong>{nextPatient ? patientLabel(nextPatient.patient) : copy.noPatientWaiting}</strong>
            </div>
            {loading ? <div className={`skeleton ${styles.loading}`} /> : null}
            {!loading && activeQueue.length === 0 ? <div className={styles.empty}>{copy.noQueue}</div> : null}
            <div className={styles.list}>
              {sortedActiveQueue.slice(0, 8).map((ticket) => (
                <article className={styles.listRow} key={ticket.id}>
                  <div className={styles.rowMain}>
                    <strong>{patientLabel(ticket.patient)}</strong>
                    <div className={styles.rowMeta}>
                      <span>{copy.queueNumber} {ticket.queueNumber ?? "—"}</span>
                      <span>{visitTypeLabel(ticket.visitType)}</span>
                      <span>{queueStatusLabel(ticket.status, copy)}</span>
                      {ticket.checkedInAt ? <span>{waitingDuration(ticket.checkedInAt, language)}</span> : null}
                    </div>
                  </div>
                  <div className={styles.rowActions}>
                    {ticket.patient ? <button className="button secondary compact" type="button" onClick={() => selectPatient(ticket.patient ?? null)}>{copy.select}</button> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, detail, icon }: { label: string; value: number; detail: string; icon: "queue" | "doctor" }) {
  return <article className={styles.metric}><ThreeDMedicalIcon name={icon} size="sm" /><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function Signal({ label, value }: { label: string; value: string }) {
  return <div className={styles.signal}><span>{label}</span><strong>{value}</strong></div>;
}

function normalizeStatus(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function queueStatusLabel(value: string, copy: typeof receptionCopy.en | typeof receptionCopy.ar) {
  const status = normalizeStatus(value);
  if (status === "waiting") return copy.waitingStatus;
  if (status === "checked_in") return copy.checkedInStatus;
  if (status === "called") return copy.called;
  if (status === "completed") return copy.completed;
  if (status === "cancelled") return copy.cancelled;
  return status.replaceAll("_", " ");
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
