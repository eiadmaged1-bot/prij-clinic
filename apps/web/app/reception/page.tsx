"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { patientLabel, type PatientPickerPatient } from "../../components/clinic/PatientPicker";
import { useI18n } from "@/i18n/useI18n";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../mvp-page";
import { receptionCopy } from "./reception-copy";

type QueueTicket = { id: string; patientId: string; queueNumber: number; status: string; priority?: string | null; visitType?: string | null; checkedInAt?: string | null; patient?: PatientPickerPatient | null };

export default function ReceptionHomePage() {
  const { language } = useI18n();
  const copy = receptionCopy[language];
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [error, setError] = useState("");

  const refreshQueue = useCallback(async () => {
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined }).catch(() => null);
    if (!response?.ok) { setError(copy.queueUnavailable); return; }
    const body = await response.json() as { queueTickets?: QueueTicket[] };
    setQueue(body.queueTickets ?? []);
    setError("");
  }, [copy.queueUnavailable]);

  useEffect(() => {
    void refreshQueue();
    window.addEventListener("clinic-queue:changed", refreshQueue);
    return () => window.removeEventListener("clinic-queue:changed", refreshQueue);
  }, [refreshQueue]);

  const waiting = useMemo(() => queue
    .filter((ticket) => ticket.status === "waiting")
    .sort((left, right) => Number(right.visitType === "urgent_kashf" || right.priority === "priority") - Number(left.visitType === "urgent_kashf" || left.priority === "priority") || left.queueNumber - right.queueNumber), [queue]);
  const current = useMemo(() => queue.find((ticket) => ticket.status === "in_room") ?? queue.find((ticket) => ticket.status === "called") ?? null, [queue]);
  const nextWaiting = waiting[0] ?? null;

  return <AppShell>
    <section className="page-header reception-page-header"><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p className="muted">{copy.subtitle}</p></section>
    <section className="reception-single-workspace" aria-label={copy.workspaceLabel}>
      <div className="reception-home-grid reception-primary-actions">
        <Link className="reception-action-card premium-depth-card" href="/patients/new"><ThreeDMedicalIcon name="patients" size="sm" /><strong>{copy.newPatient}</strong><span>{copy.newPatientHint}</span></Link>
        <Link className="reception-action-card premium-depth-card" href="/reception/check-in"><ThreeDMedicalIcon name="search" size="sm" /><strong>{copy.returningPatient}</strong><span>{copy.returningPatientHint}</span></Link>
        <Link className="reception-action-card premium-depth-card" href="/queue"><ThreeDMedicalIcon name="queue" size="sm" /><strong>{copy.waitingLine}</strong><span>{copy.waitingLineHint}</span></Link>
      </div>
      <section className="panel compact-panel reception-live-status" aria-label={copy.liveClinicStatus} data-reception-live-status>
        <div className="section-heading compact-section-heading"><div><p className="eyebrow">{copy.liveClinicStatus}</p><h2>{copy.nextToDoctor}</h2></div><button className="button secondary compact" type="button" onClick={() => void refreshQueue()}>{copy.refresh}</button></div>
        {error ? <p className="notice" role="status">{error}</p> : null}
        <p className="reception-current-patient" data-next-to-doctor><strong>{current ? patientLabel(current.patient) : copy.doctorAvailable}</strong></p>
        <div className="reception-queue-summary" aria-label={copy.waitingSummary}>
          <span><strong>{waiting.length}</strong> {copy.waiting}</span>
          <span><strong>{nextWaiting ? patientLabel(nextWaiting.patient) : copy.none}</strong> {copy.nextWaiting}</span>
        </div>
      </section>
    </section>
  </AppShell>;
}
