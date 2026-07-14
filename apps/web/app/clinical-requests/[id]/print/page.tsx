"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api-base-url";
import styles from "./print.module.css";

type PrintableRequest = {
  id: string;
  createdAt: string;
  requestedFollowUpDate?: string | null;
  requestNote?: string | null;
  status: string;
  patient?: { firstName?: string; lastName?: string; medicalRecordNumber?: string; dateOfBirth?: string | null };
  doctor?: { displayName?: string };
  items: Array<{ id: string; testName: string; category?: string; instructions?: string | null }>;
};

export default function InvestigationPrintPage() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<PrintableRequest | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    void fetch(`${getApiBaseUrl()}/clinical-requests/${encodeURIComponent(params.id)}/print`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined })
      .then(async (response) => { if (!response.ok) throw new Error(); setRequest(await response.json() as PrintableRequest); })
      .catch(() => setError("This investigation request could not be prepared for printing."));
  }, [params.id]);

  if (error) return <main className={styles.message}>{error}</main>;
  if (!request) return <main className={styles.message}>Preparing investigation request…</main>;
  const patientName = [request.patient?.firstName, request.patient?.lastName].filter(Boolean).join(" ") || "Patient";
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(request.createdAt));

  return <main>
    <div className={styles.toolbar}><button type="button" onClick={() => window.print()}>Print investigation request</button></div>
    <article className={styles.paper} data-investigation-print-page>
      <header className={styles.clinicHeader}><div><strong>Prij Clinic</strong><span>Investigation request</span></div><div><span>Reference</span><strong>{request.id.slice(0, 8).toUpperCase()}</strong></div></header>
      <section className={styles.patientGrid}>
        <div><span>Patient</span><strong dir={direction(patientName)}>{patientName}</strong></div>
        <div><span>MRN</span><strong>{request.patient?.medicalRecordNumber || "—"}</strong></div>
        <div><span>Date</span><strong>{date}</strong></div>
        <div><span>Doctor</span><strong>{request.doctor?.displayName || "Doctor"}</strong></div>
      </section>
      <section className={styles.requests}><h1>Requested investigations</h1>{request.items.map((item, index) => <article className={styles.request} key={item.id} dir={direction(`${item.testName} ${item.instructions ?? ""}`)}><div><strong>{index + 1}. {item.testName}</strong><span>{item.category?.replaceAll("_", " ")}</span></div>{item.instructions ? <p><b>Indication:</b> {item.instructions}</p> : null}</article>)}</section>
      <section className={styles.meta}>{request.requestNote ? <p dir={direction(request.requestNote)}><b>Clinical indication:</b> {request.requestNote}</p> : null}{request.requestedFollowUpDate ? <p><b>Follow-up:</b> {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(request.requestedFollowUpDate))}</p> : null}</section>
      <footer><div><span>Doctor signature / stamp</span></div></footer>
    </article>
  </main>;
}

function direction(value: string) { return /[\u0600-\u06ff]/.test(value) ? "rtl" : "ltr"; }
