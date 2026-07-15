"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { patientLabel, type PatientPickerPatient } from "../../components/clinic/PatientPicker";
import { useI18n } from "@/i18n/useI18n";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { visitTypeLabel } from "@/lib/visit-types";
import { AppShell } from "../mvp-page";
import { receptionCopy } from "./reception-copy";

type QueueTicket = { id: string; patientId: string; queueNumber: number; status: string; priority?: string | null; visitType?: string | null; patient?: PatientPickerPatient | null };

export default function ReceptionHomePage() {
  const { language } = useI18n();
  const copy = receptionCopy[language];
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [error, setError] = useState("");

  const refreshQueue = useCallback(async () => {
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined }).catch(() => null);
    if (!response?.ok) { setError("Queue preview is temporarily unavailable."); return; }
    const body = await response.json() as { queueTickets?: QueueTicket[] };
    setQueue(body.queueTickets ?? []);
    setError("");
  }, []);

  useEffect(() => {
    void refreshQueue();
    window.addEventListener("clinic-queue:changed", refreshQueue);
    return () => window.removeEventListener("clinic-queue:changed", refreshQueue);
  }, [refreshQueue]);

  const waiting = useMemo(() => queue.filter((ticket) => ticket.status === "waiting"), [queue]);
  const urgent = waiting.filter((ticket) => ticket.visitType === "urgent_kashf" || ticket.priority === "priority");
  const next = urgent[0] ?? waiting[0] ?? null;

  return <AppShell>
    <section className="page-header"><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1></section>
    <section className="compact-action-grid reception-home-actions" aria-label="Reception actions">
      <Link className="reception-action-card premium-depth-card" href="/reception/check-in"><ThreeDMedicalIcon name="reception" size="sm" /><span>{copy.checkIn}</span></Link>
      <Link className="reception-action-card premium-depth-card" href="/patients/new"><ThreeDMedicalIcon name="patients" size="sm" /><span>{copy.newPatient}</span></Link>
      <Link className="reception-action-card premium-depth-card" href="/queue"><ThreeDMedicalIcon name="queue" size="sm" /><span>{copy.openQueue}</span></Link>
    </section>
    <section className="panel compact-panel today-summary-card" aria-label={copy.queuePreview}>
      <div className="section-heading"><h2>{copy.queuePreview}</h2><button className="button secondary compact" type="button" onClick={() => void refreshQueue()}>Refresh</button></div>
      {error ? <p className="notice" role="status">{error}</p> : null}
      <p className="queue-compact-line queue-indicator-row-clean">{copy.waiting}: {waiting.length} {"\u00b7"} {copy.urgent}: {urgent.length}</p>
      <p className="queue-compact-line"><strong>{copy.nextPatient}:</strong> {next ? `${patientLabel(next.patient)} \u00b7 ${visitTypeLabel(next.visitType)}` : copy.noPatientWaiting}</p>
      <Link className="button secondary compact" href="/queue">{copy.openQueue}</Link>
    </section>
  </AppShell>;
}
