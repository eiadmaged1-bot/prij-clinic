"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { VisitTypeSelector } from "../../components/clinic/VisitTypeSelector";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { visitTypeLabel, type VisitTypeValue } from "@/lib/visit-types";
import { useI18n } from "@/i18n/useI18n";
import { AppShell } from "../mvp-page";

type Patient = { id: string; medicalRecordNumber?: string | null; firstName?: string | null; lastName?: string | null; phone?: string | null; status?: string | null };
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
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [query, setQuery] = useState("");
  const [lookupOpen, setLookupOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [visitType, setVisitType] = useState<VisitTypeValue | "">("");
  const [status, setStatus] = useState("");
  const { language } = useI18n();
  const copy = receptionCopy[language];
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);
  const headers = useMemo(() => token ? { authorization: `Bearer ${token}` } : undefined, [token]);

  const load = useCallback(async () => {
    const [patientResponse, queueResponse] = await Promise.all([
      fetch(`${getApiBaseUrl()}/patients`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers })
    ]);
    setPatients(patientResponse.ok ? ((await patientResponse.json()) as { patients?: Patient[] }).patients ?? [] : []);
    setQueue(queueResponse.ok ? ((await queueResponse.json()) as { queueTickets?: QueueTicket[] }).queueTickets ?? [] : []);
  }, [headers]);

  useEffect(() => {
    void load();
  }, [load]);

  const waiting = queue.filter((ticket) => ticket.status === "waiting");
  const urgentWaiting = waiting.filter((ticket) => ticket.visitType === "urgent_kashf" || ticket.priority === "priority");
  const nextPatient = [...urgentWaiting, ...waiting.filter((ticket) => !urgentWaiting.includes(ticket))][0] ?? null;
  const trimmedQuery = query.trim().toLowerCase();
  const results = trimmedQuery ? patients.filter((patient) => patientSearchText(patient).includes(trimmedQuery)).slice(0, 8) : [];
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
      headers: { "content-type": "application/json", ...(headers ?? {}) },
      body: JSON.stringify({ patientId: selectedPatient.id, visitType, priority: visitType === "urgent_kashf" ? "priority" : "routine", checkInMethod: "Returning Patient" })
    }).catch(() => null);
    setStatus(response?.ok ? copy.patientAddedToQueue : copy.couldNotAddToQueue);
    if (response?.ok) {
      setSelectedPatient(null);
      setVisitType("");
      await load();
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
          <button className="button secondary compact icon-only-button" type="button" onClick={load} aria-label={copy.refresh}>
            <ThreeDMedicalIcon name="search" size="sm" tone="slate" />
          </button>
        </div>
      </section>

      <section className="panel compact-panel">
        <label>
          {copy.searchPatient}
          <input value={query} onChange={(event) => { setQuery(event.target.value); setLookupOpen(true); }} placeholder={copy.searchPlaceholder} />
        </label>
      </section>

      <section className="reception-home-grid compact-action-grid" aria-label={copy.receptionActions}>
        <Link className="reception-action-card premium-depth-card" href="/patients/new"><ThreeDMedicalIcon name="patients" size="sm" /><span>{copy.newPatient}</span></Link>
        <Link className="reception-action-card premium-depth-card" href="/reception/qr-scan"><ThreeDMedicalIcon name="search" size="sm" /><span>{copy.returningPatientQr}</span></Link>
        <Link className="reception-action-card premium-depth-card" href="/queue"><ThreeDMedicalIcon name="queue" size="sm" /><span>{copy.queue}</span></Link>
        <Link className="reception-action-card premium-depth-card" href="/calendar"><ThreeDMedicalIcon name="calendar" size="sm" /><span>{copy.appointments}</span></Link>
      </section>

      <section className="panel compact-panel today-summary-card" aria-label={copy.queueNow}>
        <div className="section-heading compact-section-heading">
          <h2>{copy.queueNow}</h2>
        </div>
        <p className="queue-compact-line">{copy.waiting}: {waiting.length} · {copy.urgent}: {urgentWaiting.length}</p>
        <p className="queue-compact-line"><strong>{copy.nextPatient}:</strong> {nextPatient ? patientLabel(nextPatient.patient) : copy.noPatientWaiting}</p>
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
                <span>{patient.medicalRecordNumber ?? "No MRN"} | {patient.phone ?? copy.noPhone}</span>
              </button>
            ))}
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
    eyebrow: "الاستقبال",
    title: "واجهة الاستقبال",
    receptionActions: "إجراءات الاستقبال",
    searchPatient: "بحث عن مريضة",
    searchPlaceholder: "بحث بالاسم أو الهاتف أو رقم الملف أو QR",
    newPatient: "مريضة جديدة",
    returningPatientQr: "مريضة مسجلة / QR",
    queue: "قائمة الانتظار",
    appointments: "المواعيد",
    queueNow: "قائمة الانتظار الآن",
    waiting: "في الانتظار الآن",
    urgent: "مستعجل",
    nextPatient: "المريضة التالية",
    noPatientWaiting: "لا توجد مريضات في الانتظار",
    findPatient: "البحث عن المريضة",
    refresh: "تحديث",
    noPhone: "لا يوجد رقم هاتف",
    searchToFind: "ابحث عن مريضة مسجلة.",
    noMatch: "لا توجد مريضة مطابقة.",
    alreadyInQueue: "موجودة بالفعل في الانتظار - رقم",
    alreadyWithDoctor: "المريضة موجودة مع الطبيب بالفعل",
    openReceptionProfile: "فتح ملف الاستقبال",
    openQueue: "فتح قائمة الانتظار",
    addToQueue: "إضافة للانتظار",
    queuePreview: "قائمة انتظار اليوم",
    waitingDurationNotRecorded: "مدة الانتظار غير مسجلة",
    selectPatientVisitType: "اختر المريضة ونوع الزيارة أولا",
    addingToQueue: "جار الإضافة للانتظار",
    patientAddedToQueue: "تمت إضافة المريضة للانتظار",
    couldNotAddToQueue: "تعذرت إضافة المريضة للانتظار"
  }
} as const;
