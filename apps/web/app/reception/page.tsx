"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { VisitTypeSelector } from "../../components/clinic/VisitTypeSelector";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { useIdempotencyKey } from "@/lib/idempotency-key";
import { visitTypeLabel, type VisitTypeValue } from "@/lib/visit-types";
import { useI18n } from "@/i18n/useI18n";
import { AppShell } from "../mvp-page";
import { useSession } from "../session";
import { receptionCopy as cleanReceptionCopy, receptionWorkflowCopy } from "./reception-copy";

type Patient = { id: string; medicalRecordNumber?: string | null; firstName?: string | null; lastName?: string | null; phone?: string | null; phoneSuffix?: string | null; dateOfBirth?: string | null; status?: string | null; branch?: { name?: string | null } | null; latestVisitDate?: string | null; queueState?: { status?: string | null; queueNumber?: number | null } | null };
type QueueTicket = { id: string; patientId: string; queueNumber?: number; status: string; priority?: string | null; visitType?: VisitTypeValue | null; checkedInAt?: string | null; patient?: Patient | null };

export default function ReceptionHomePage() {
  return (
    <AppShell>
      <ReceptionHomeContent />
    </AppShell>
  );
}

function ReceptionHomeContent() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientPage, setPatientPage] = useState(1);
  const [hasMorePatients, setHasMorePatients] = useState(false);
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [query, setQuery] = useState("");
  const [lookupOpen, setLookupOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [visitType, setVisitType] = useState<VisitTypeValue | "">("");
  const [status, setStatus] = useState("");
  const { key: idempotencyKey } = useIdempotencyKey();
  const { language } = useI18n();
  const { user } = useSession();
  const copy = cleanReceptionCopy[language];
  const legacyWorkflowCopy = language === "ar" ? {
    checkIn: "تسجيل الحضور",
    todayAppointments: "مواعيد اليوم",
    bookAppointment: "حجز موعد",
    paymentStatus: "حالة الدفع"
  } : {
    checkIn: "Check-in",
    todayAppointments: "Today’s appointments",
    bookAppointment: "Book appointment",
    paymentStatus: "Payment status"
  };
  void legacyWorkflowCopy;
  const workflowCopy = receptionWorkflowCopy[language];
  const canViewPaymentStatus = Boolean(user?.permissions.includes("billing.read"));
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);
  const headers = useMemo(() => token ? { authorization: `Bearer ${token}` } : undefined, [token]);

  const load = useCallback(async () => {
    const queueResponse = await fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers });
    setQueue(queueResponse.ok ? ((await queueResponse.json()) as { queueTickets?: QueueTicket[] }).queueTickets ?? [] : []);
  }, [headers]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refreshQueue = () => void load();
    window.addEventListener("clinic-queue:changed", refreshQueue);
    return () => window.removeEventListener("clinic-queue:changed", refreshQueue);
  }, [load]);

  useEffect(() => {
    const search = query.trim();
    if (search.length < 2) {
      setPatients([]);
      setHasMorePatients(false);
      return;
    }
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ q: search, page: "1", limit: "20" });
      void fetch(`${getApiBaseUrl()}/patients?${params.toString()}`, { credentials: "include", headers })
        .then(async (response) => response.ok ? response.json() as Promise<{ patients?: Patient[]; pageInfo?: { hasMore?: boolean } }> : { patients: [], pageInfo: { hasMore: false } })
        .then((data) => {
          setPatients(data.patients ?? []);
          setPatientPage(1);
          setHasMorePatients(Boolean(data.pageInfo?.hasMore));
        })
        .catch(() => {
          setPatients([]);
          setHasMorePatients(false);
        });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [headers, query]);

  const waiting = queue.filter((ticket) => ticket.status === "waiting");
  const urgentWaiting = waiting.filter((ticket) => ticket.visitType === "urgent_kashf" || ticket.priority === "priority");
  const nextPatient = [...urgentWaiting, ...waiting.filter((ticket) => !urgentWaiting.includes(ticket))][0] ?? null;
  const trimmedQuery = query.trim().toLowerCase();
  const results = trimmedQuery ? patients : [];
  const activeTicket = selectedPatient ? queue.find((ticket) => ticket.patientId === selectedPatient.id && ["waiting", "called"].includes(ticket.status)) : null;
  const selectedQueueIndex = selectedPatient ? waiting.findIndex((ticket) => ticket.patientId === selectedPatient.id) : -1;

  async function addReturningPatientToQueue() {
    if (!selectedPatient || !visitType) {
      setStatus(copy.selectPatientVisitType);
      return;
    }
    if (activeTicket) {
      setStatus(activeTicket.status === "called" ? copy.alreadyWithDoctor : copy.alreadyInQueue);
      return;
    }

    setStatus(copy.addingToQueue);
    const response = await fetch(`${getApiBaseUrl()}/queue/check-in`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", "idempotency-key": idempotencyKey, ...(headers ?? {}) },
      body: JSON.stringify({ patientId: selectedPatient.id, visitType, priority: visitType === "urgent_kashf" ? "priority" : "routine", checkInMethod: "Returning Patient" })
    }).catch(() => null);

    if (response?.ok) {
      setStatus(copy.patientAddedToQueue);
      setSelectedPatient(null);
      setVisitType("");
      await load();
      window.dispatchEvent(new CustomEvent("clinic-queue:changed", { detail: { patientId: selectedPatient.id } }));
    } else {
      if (response) {
        const body = await response.json().catch(() => ({}));
        const code = body.error?.code || body.code;
        if (code === "QUEUE_ACTIVE_TICKET_EXISTS") {
          setStatus(copy.alreadyInQueue);
        } else {
          setStatus(copy.couldNotAddToQueue);
        }
      } else {
        setStatus(copy.couldNotAddToQueue);
      }
    }
  }

  return (
    <>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
          </div>
          <button className="button secondary compact icon-only-button" type="button" onClick={load} aria-label={copy.refresh} title={copy.refresh}>
            <ThreeDMedicalIcon name="search" size="sm" tone="slate" />
          </button>
        </div>
      </section>

      <section className="panel compact-panel">
        <label>
          {copy.searchPatient}
          <input value={query} onChange={(event) => { setQuery(event.target.value); setSelectedPatient(null); setStatus(""); setLookupOpen(true); }} placeholder={copy.searchPlaceholder} />
        </label>
      </section>

      <section className="reception-home-grid compact-action-grid" aria-label={copy.receptionActions}>
        <Link className="reception-action-card premium-depth-card" href="/patients/new"><ThreeDMedicalIcon name="patients" size="sm" /><span>{copy.newPatient}</span></Link>
        <Link className="reception-action-card premium-depth-card" href="/reception/qr-scan"><ThreeDMedicalIcon name="search" size="sm" /><span>{copy.returningPatientQr}</span></Link>
        <Link className="reception-action-card premium-depth-card" href="/reception/check-in"><ThreeDMedicalIcon name="reception" size="sm" /><span>{workflowCopy.checkIn}</span></Link>
        <Link className="reception-action-card premium-depth-card" href="/calendar"><ThreeDMedicalIcon name="calendar" size="sm" /><span>{workflowCopy.todayAppointments}</span></Link>
        <Link className="reception-action-card premium-depth-card" href="/calendar?mode=new"><ThreeDMedicalIcon name="calendar" size="sm" /><span>{workflowCopy.bookAppointment}</span></Link>
        <Link className="reception-action-card premium-depth-card" href="/queue"><ThreeDMedicalIcon name="queue" size="sm" /><span>{copy.queue}</span></Link>
        {canViewPaymentStatus ? <Link className="reception-action-card premium-depth-card" href="/billing"><ThreeDMedicalIcon name="billing" size="sm" /><span>{workflowCopy.paymentStatus}</span></Link> : null}
      </section>

      <section className="panel compact-panel today-summary-card" aria-label={copy.queueNow}>
        <div className="section-heading compact-section-heading">
          <h2>{copy.queueNow}</h2>
        </div>
        <p className="queue-compact-line queue-indicator-row">{copy.waiting}: {waiting.length} Ã‚Â· {copy.urgent}: {urgentWaiting.length}</p>
        <p className="queue-indicator-row-clean">{copy.waiting}: {waiting.length} · {copy.urgent}: {urgentWaiting.length}</p>
        <p className="queue-compact-line"><strong>{copy.nextPatient}:</strong> {nextPatient ? patientLabel(nextPatient.patient) : copy.noPatientWaiting}</p>
        <Link className="button secondary compact" href="/queue">{copy.openQueue}</Link>
      </section>

      {lookupOpen ? (
        <section className="panel compact-panel returning-patient-panel">
          <div className="section-heading">
            <div>
              <h2>{copy.returningPatientQr}</h2>
              <p className="muted">{copy.searchPlaceholder}</p>
            </div>
            <Link className="button secondary compact" href="/reception/qr-scan">{copy.findPatient}</Link>
          </div>
          <div className="dense-card-list">
            {results.map((patient) => (
              <button className={`picker-row ${selectedPatient?.id === patient.id ? "active" : ""}`} key={patient.id} type="button" onClick={() => setSelectedPatient(patient)}>
                <strong>{patientLabel(patient)}</strong>
                <span>{patient.medicalRecordNumber ?? "No MRN"} | {patient.dateOfBirth ? `DOB ${patient.dateOfBirth.slice(0, 10)}` : "DOB unavailable"} | phone …{patient.phoneSuffix ?? "none"} | {patient.branch?.name ?? "Branch unavailable"} | {patient.latestVisitDate ? `last visit ${patient.latestVisitDate.slice(0, 10)}` : "no visit"} | {patient.queueState?.status ?? "not in queue"}</span>
              </button>
            ))}
            {hasMorePatients ? <button className="button secondary compact" type="button" onClick={() => {
              const nextPage = patientPage + 1;
              const params = new URLSearchParams({ q: query.trim(), page: String(nextPage), limit: "20" });
              void fetch(`${getApiBaseUrl()}/patients?${params.toString()}`, { credentials: "include", headers })
                .then(async (response) => response.ok ? response.json() as Promise<{ patients?: Patient[]; pageInfo?: { hasMore?: boolean } }> : { patients: [], pageInfo: { hasMore: false } })
                .then((data) => {
                  setPatients((current) => [...current, ...(data.patients ?? []).filter((row) => !current.some((item) => item.id === row.id))]);
                  setPatientPage(nextPage);
                  setHasMorePatients(Boolean(data.pageInfo?.hasMore));
                });
            }}>Load more patients</button> : null}
            {!trimmedQuery ? <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="patients" size="sm" tone="slate" /><span>{copy.searchToFind}</span></p> : null}
            {trimmedQuery && !results.length ? <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="patients" size="sm" tone="slate" /><span>{copy.noMatch}</span></p> : null}
          </div>
          {selectedPatient ? (
            <div className="selected-patient-card">
              <strong>{patientLabel(selectedPatient)}</strong>
              <span>{selectedPatient.medicalRecordNumber ?? "No MRN"} | {selectedPatient.phone ?? copy.noPhone}</span>
              {activeTicket ? (
                <div className="queue-position-card" data-testid="queue-position-card">
                  <strong>{activeTicket.status === "called" ? copy.alreadyWithDoctor : `${copy.alreadyInQueue} ${selectedQueueIndex + 1}`}</strong>
                </div>
              ) : <VisitTypeSelector value={visitType} onChange={setVisitType} compact />}
              {status ? <p className="muted">{status}</p> : null}
              <div className="form-actions">
                <Link className="button secondary compact" href={`/patients/${selectedPatient.id}`}>{copy.openReceptionProfile}</Link>
                {activeTicket ? <Link className="button secondary compact" href="/queue">{copy.openQueue}</Link> : <button className="button compact" type="button" onClick={() => void addReturningPatientToQueue()} disabled={!visitType}>{copy.addToQueue}</button>}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {waiting.length ? (
        <section className="panel compact-panel waiting-line-panel">
          <div className="section-heading">
            <h2>{copy.queuePreview}</h2>
            <span className="badge">{waiting.length}</span>
          </div>
          <div className="dense-card-list" data-testid="ordered-waiting-line">
            {waiting.slice(0, 4).map((ticket, index) => (
              <button className="data-row dense clickable-waiting-row" key={ticket.id} type="button" onClick={() => { setSelectedPatient(ticket.patient ?? null); setLookupOpen(true); }}>
                <div className="data-row-header">
                  <strong>{index + 1}. {patientLabel(ticket.patient)} | {visitTypeLabel(ticket.visitType)} | {copy.waiting}</strong>
                </div>
                <p className="muted">{ticket.checkedInAt ? waitingDuration(ticket.checkedInAt) : copy.waitingDurationNotRecorded}</p>
              </button>
            ))}
          </div>
          {waiting.length > 4 ? <Link className="button secondary compact" href="/queue">{copy.openQueue}</Link> : null}
        </section>
      ) : null}
    </>
  );
}

function patientLabel(patient?: Patient | null) {
  if (!patient) return "Patient";
  return `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim() || patient.medicalRecordNumber || "Patient";
}

function patientSearchText(patient?: Patient | null) {
  return `${patientLabel(patient)} ${patient?.phone ?? ""} ${patient?.medicalRecordNumber ?? ""} ${patient?.id ?? ""}`.toLowerCase();
}

function waitingDuration(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min waiting`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m waiting`;
}

const receptionCopy = {
  en: {
    eyebrow: "Reception",
    title: "Reception",
    receptionActions: "Reception actions",
    searchPatient: "Search patient",
    searchPlaceholder: "Search by name, phone, file number, QR",
    newPatient: "New Patient",
    returningPatientQr: "Returning Patient / QR",
    queue: "Queue",
    appointments: "Appointments",
    queueNow: "Queue now",
    waiting: "Waiting now",
    urgent: "Urgent",
    nextPatient: "Next patient",
    noPatientWaiting: "No patient waiting",
    findPatient: "Find patient",
    refresh: "Refresh",
    noPhone: "No phone",
    searchToFind: "Search to find a returning patient.",
    noMatch: "No matching patient found.",
    alreadyInQueue: "Already in queue - Position",
    alreadyWithDoctor: "Patient is already with doctor",
    openReceptionProfile: "Open reception profile",
    openQueue: "Open queue",
    addToQueue: "Add to queue",
    queuePreview: "Queue preview",
    waitingDurationNotRecorded: "Waiting duration not recorded",
    selectPatientVisitType: "Select patient and visit type first",
    addingToQueue: "Adding to queue",
    patientAddedToQueue: "Patient added to queue",
    couldNotAddToQueue: "Could not add patient to queue"
  },
  ar: {
    eyebrow: "ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§ÃƒËœÃ‚Â³ÃƒËœÃ‚ÂªÃƒâ„¢Ã¢â‚¬Å¡ÃƒËœÃ‚Â¨ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾",
    title: "Ãƒâ„¢Ã‹â€ ÃƒËœÃ‚Â§ÃƒËœÃ‚Â¬Ãƒâ„¢Ã¢â‚¬Â¡ÃƒËœÃ‚Â© ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§ÃƒËœÃ‚Â³ÃƒËœÃ‚ÂªÃƒâ„¢Ã¢â‚¬Å¡ÃƒËœÃ‚Â¨ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾",
    receptionActions: "ÃƒËœÃ‚Â¥ÃƒËœÃ‚Â¬ÃƒËœÃ‚Â±ÃƒËœÃ‚Â§ÃƒËœÃ‚Â¡ÃƒËœÃ‚Â§ÃƒËœÃ‚Âª ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§ÃƒËœÃ‚Â³ÃƒËœÃ‚ÂªÃƒâ„¢Ã¢â‚¬Å¡ÃƒËœÃ‚Â¨ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾",
    searchPatient: "ÃƒËœÃ‚Â¨ÃƒËœÃ‚Â­ÃƒËœÃ‚Â« ÃƒËœÃ‚Â¹Ãƒâ„¢Ã¢â‚¬Â  Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â±Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â¶ÃƒËœÃ‚Â©",
    searchPlaceholder: "ÃƒËœÃ‚Â¨ÃƒËœÃ‚Â­ÃƒËœÃ‚Â« ÃƒËœÃ‚Â¨ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§ÃƒËœÃ‚Â³Ãƒâ„¢Ã¢â‚¬Â¦ ÃƒËœÃ‚Â£Ãƒâ„¢Ã‹â€  ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Â¡ÃƒËœÃ‚Â§ÃƒËœÃ‚ÂªÃƒâ„¢Ã‚Â ÃƒËœÃ‚Â£Ãƒâ„¢Ã‹â€  ÃƒËœÃ‚Â±Ãƒâ„¢Ã¢â‚¬Å¡Ãƒâ„¢Ã¢â‚¬Â¦ ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Â¦Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã‚Â ÃƒËœÃ‚Â£Ãƒâ„¢Ã‹â€  QR",
    newPatient: "Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â±Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â¶ÃƒËœÃ‚Â© ÃƒËœÃ‚Â¬ÃƒËœÃ‚Â¯Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â¯ÃƒËœÃ‚Â©",
    returningPatientQr: "Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â±Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â¶ÃƒËœÃ‚Â© Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â³ÃƒËœÃ‚Â¬Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â© / QR",
    queue: "Ãƒâ„¢Ã¢â‚¬Å¡ÃƒËœÃ‚Â§ÃƒËœÃ‚Â¦Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â© ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚ÂªÃƒËœÃ‚Â¸ÃƒËœÃ‚Â§ÃƒËœÃ‚Â±",
    appointments: "ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Â¦Ãƒâ„¢Ã‹â€ ÃƒËœÃ‚Â§ÃƒËœÃ‚Â¹Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â¯",
    queueNow: "Ãƒâ„¢Ã¢â‚¬Å¡ÃƒËœÃ‚Â§ÃƒËœÃ‚Â¦Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â© ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚ÂªÃƒËœÃ‚Â¸ÃƒËœÃ‚Â§ÃƒËœÃ‚Â± ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â¢Ãƒâ„¢Ã¢â‚¬Â ",
    waiting: "Ãƒâ„¢Ã‚ÂÃƒâ„¢Ã…Â  ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚ÂªÃƒËœÃ‚Â¸ÃƒËœÃ‚Â§ÃƒËœÃ‚Â± ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â¢Ãƒâ„¢Ã¢â‚¬Â ",
    urgent: "Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â³ÃƒËœÃ‚ÂªÃƒËœÃ‚Â¹ÃƒËœÃ‚Â¬Ãƒâ„¢Ã¢â‚¬Å¾",
    nextPatient: "ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â±Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â¶ÃƒËœÃ‚Â© ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚ÂªÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â©",
    noPatientWaiting: "Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§ ÃƒËœÃ‚ÂªÃƒâ„¢Ã‹â€ ÃƒËœÃ‚Â¬ÃƒËœÃ‚Â¯ Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â±Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â¶ÃƒËœÃ‚Â§ÃƒËœÃ‚Âª Ãƒâ„¢Ã‚ÂÃƒâ„¢Ã…Â  ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚ÂªÃƒËœÃ‚Â¸ÃƒËœÃ‚Â§ÃƒËœÃ‚Â±",
    findPatient: "ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â¨ÃƒËœÃ‚Â­ÃƒËœÃ‚Â« ÃƒËœÃ‚Â¹Ãƒâ„¢Ã¢â‚¬Â  ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â±Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â¶ÃƒËœÃ‚Â©",
    refresh: "ÃƒËœÃ‚ÂªÃƒËœÃ‚Â­ÃƒËœÃ‚Â¯Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â«",
    noPhone: "Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§ Ãƒâ„¢Ã…Â Ãƒâ„¢Ã‹â€ ÃƒËœÃ‚Â¬ÃƒËœÃ‚Â¯ ÃƒËœÃ‚Â±Ãƒâ„¢Ã¢â‚¬Å¡Ãƒâ„¢Ã¢â‚¬Â¦ Ãƒâ„¢Ã¢â‚¬Â¡ÃƒËœÃ‚Â§ÃƒËœÃ‚ÂªÃƒâ„¢Ã‚Â",
    searchToFind: "ÃƒËœÃ‚Â§ÃƒËœÃ‚Â¨ÃƒËœÃ‚Â­ÃƒËœÃ‚Â« ÃƒËœÃ‚Â¹Ãƒâ„¢Ã¢â‚¬Â  Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â±Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â¶ÃƒËœÃ‚Â© Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â³ÃƒËœÃ‚Â¬Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â©.",
    noMatch: "Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§ ÃƒËœÃ‚ÂªÃƒâ„¢Ã‹â€ ÃƒËœÃ‚Â¬ÃƒËœÃ‚Â¯ Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â±Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â¶ÃƒËœÃ‚Â© Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â·ÃƒËœÃ‚Â§ÃƒËœÃ‚Â¨Ãƒâ„¢Ã¢â‚¬Å¡ÃƒËœÃ‚Â©.",
    alreadyInQueue: "Ãƒâ„¢Ã¢â‚¬Â¦Ãƒâ„¢Ã‹â€ ÃƒËœÃ‚Â¬Ãƒâ„¢Ã‹â€ ÃƒËœÃ‚Â¯ÃƒËœÃ‚Â© ÃƒËœÃ‚Â¨ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã‚ÂÃƒËœÃ‚Â¹Ãƒâ„¢Ã¢â‚¬Å¾ Ãƒâ„¢Ã‚ÂÃƒâ„¢Ã…Â  ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚ÂªÃƒËœÃ‚Â¸ÃƒËœÃ‚Â§ÃƒËœÃ‚Â± - ÃƒËœÃ‚Â±Ãƒâ„¢Ã¢â‚¬Å¡Ãƒâ„¢Ã¢â‚¬Â¦",
    alreadyWithDoctor: "ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â±Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â¶ÃƒËœÃ‚Â© Ãƒâ„¢Ã¢â‚¬Â¦Ãƒâ„¢Ã‹â€ ÃƒËœÃ‚Â¬Ãƒâ„¢Ã‹â€ ÃƒËœÃ‚Â¯ÃƒËœÃ‚Â© Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â¹ ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â·ÃƒËœÃ‚Â¨Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â¨ ÃƒËœÃ‚Â¨ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã‚ÂÃƒËœÃ‚Â¹Ãƒâ„¢Ã¢â‚¬Å¾",
    openReceptionProfile: "Ãƒâ„¢Ã‚ÂÃƒËœÃ‚ÂªÃƒËœÃ‚Â­ Ãƒâ„¢Ã¢â‚¬Â¦Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã‚Â ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§ÃƒËœÃ‚Â³ÃƒËœÃ‚ÂªÃƒâ„¢Ã¢â‚¬Å¡ÃƒËœÃ‚Â¨ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾",
    openQueue: "Ãƒâ„¢Ã‚ÂÃƒËœÃ‚ÂªÃƒËœÃ‚Â­ Ãƒâ„¢Ã¢â‚¬Å¡ÃƒËœÃ‚Â§ÃƒËœÃ‚Â¦Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â© ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚ÂªÃƒËœÃ‚Â¸ÃƒËœÃ‚Â§ÃƒËœÃ‚Â±",
    addToQueue: "ÃƒËœÃ‚Â¥ÃƒËœÃ‚Â¶ÃƒËœÃ‚Â§Ãƒâ„¢Ã‚ÂÃƒËœÃ‚Â© Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚ÂªÃƒËœÃ‚Â¸ÃƒËœÃ‚Â§ÃƒËœÃ‚Â±",
    queuePreview: "Ãƒâ„¢Ã¢â‚¬Å¡ÃƒËœÃ‚Â§ÃƒËœÃ‚Â¦Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â© ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚ÂªÃƒËœÃ‚Â¸ÃƒËœÃ‚Â§ÃƒËœÃ‚Â± ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã…Â Ãƒâ„¢Ã‹â€ Ãƒâ„¢Ã¢â‚¬Â¦",
    waitingDurationNotRecorded: "Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â¯ÃƒËœÃ‚Â© ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚ÂªÃƒËœÃ‚Â¸ÃƒËœÃ‚Â§ÃƒËœÃ‚Â± ÃƒËœÃ‚ÂºÃƒâ„¢Ã…Â ÃƒËœÃ‚Â± Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â³ÃƒËœÃ‚Â¬Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â©",
    selectPatientVisitType: "ÃƒËœÃ‚Â§ÃƒËœÃ‚Â®ÃƒËœÃ‚ÂªÃƒËœÃ‚Â± ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â±Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â¶ÃƒËœÃ‚Â© Ãƒâ„¢Ã‹â€ Ãƒâ„¢Ã¢â‚¬Â Ãƒâ„¢Ã‹â€ ÃƒËœÃ‚Â¹ ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â²Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â§ÃƒËœÃ‚Â±ÃƒËœÃ‚Â© ÃƒËœÃ‚Â£Ãƒâ„¢Ã‹â€ Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§",
    addingToQueue: "ÃƒËœÃ‚Â¬ÃƒËœÃ‚Â§ÃƒËœÃ‚Â± ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â¥ÃƒËœÃ‚Â¶ÃƒËœÃ‚Â§Ãƒâ„¢Ã‚ÂÃƒËœÃ‚Â© Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚ÂªÃƒËœÃ‚Â¸ÃƒËœÃ‚Â§ÃƒËœÃ‚Â±",
    patientAddedToQueue: "ÃƒËœÃ‚ÂªÃƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Âª ÃƒËœÃ‚Â¥ÃƒËœÃ‚Â¶ÃƒËœÃ‚Â§Ãƒâ„¢Ã‚ÂÃƒËœÃ‚Â© ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â±Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â¶ÃƒËœÃ‚Â© Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚ÂªÃƒËœÃ‚Â¸ÃƒËœÃ‚Â§ÃƒËœÃ‚Â±",
    couldNotAddToQueue: "ÃƒËœÃ‚ÂªÃƒËœÃ‚Â¹ÃƒËœÃ‚Â°ÃƒËœÃ‚Â±ÃƒËœÃ‚Âª ÃƒËœÃ‚Â¥ÃƒËœÃ‚Â¶ÃƒËœÃ‚Â§Ãƒâ„¢Ã‚ÂÃƒËœÃ‚Â© ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â±Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â¶ÃƒËœÃ‚Â© Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚ÂªÃƒËœÃ‚Â¸ÃƒËœÃ‚Â§ÃƒËœÃ‚Â±"
  }
} as const;
void receptionCopy;
