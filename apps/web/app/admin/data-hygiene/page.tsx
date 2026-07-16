"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../../mvp-page";

type ReviewRecord = { id: string; resource?: "patient" | "external-intake" | "ultrasound" | "queue-lock"; medicalRecordNumber?: string; firstName?: string; lastName?: string; dataClassification?: string; signal?: string };

export default function DataHygienePage() {
  const [view, setView] = useState("candidates");
  const [records, setRecords] = useState<ReviewRecord[]>([]);
  const [status, setStatus] = useState("Loading review candidates…");

  useEffect(() => { void load(); }, [view]);

  async function load() {
    setStatus("Loading review candidates…");
    const response = await request(`/data-hygiene/review?view=${encodeURIComponent(view)}`);
    if (!response.ok) return setStatus(await errorMessage(response, "Data Hygiene Center could not be loaded."));
    const body = await response.json() as { records?: ReviewRecord[] };
    setRecords(body.records ?? []);
    setStatus(body.records?.length ? `${body.records.length} records require review.` : "No records require review in this view.");
  }

  async function classify(record: ReviewRecord, classification: "REAL" | "TEST" | "NEEDS_REVIEW" | "QUARANTINED") {
    if (record.resource === "queue-lock") return setStatus("Queue locks are detection-only here; queue recovery owns lock repair.");
    const reason = window.prompt(`Reason for marking this record ${classification}`)?.trim();
    if (!reason) return;
    const response = await request(`/data-hygiene/${record.resource ?? "patient"}/${record.id}/classification`, "PATCH", { classification, reason });
    setStatus(response.ok ? "Classification saved and audited." : await errorMessage(response, "Classification could not be saved."));
    if (response.ok) await load();
  }

  async function exportReport() {
    const response = await request("/data-hygiene/report");
    if (!response.ok) return setStatus(await errorMessage(response, "Review report could not be generated."));
    const report = await response.json();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "data-hygiene-review-report.json"; link.click(); URL.revokeObjectURL(link.href);
  }

  return <AppShell>
    <section className="page-header"><p className="eyebrow">Owner only</p><h1>Data Hygiene Center</h1><p className="muted">Signals are review candidates only. Nothing is classified or deleted automatically.</p></section>
    <section className="panel compact-panel"><div className="toolbar"><label>Review view<select value={view} onChange={(event) => setView(event.target.value)}><option value="candidates">QA/test candidates</option><option value="incomplete">Incomplete records</option><option value="duplicates">Exact-phone duplicates</option><option value="external-intake">External intake candidates</option><option value="empty-ultrasounds">Empty ultrasound candidates</option><option value="orphan-locks">Orphan queue locks</option></select></label><button className="button secondary compact" type="button" onClick={() => void exportReport()}>Export review report</button></div><p className="notice" role="status">{status}</p></section>
    <section className="panel"><div className="data-list">{records.map((record) => <article className="data-row dense" key={`${record.resource ?? "patient"}:${record.id}`}><div className="data-row-header"><strong>{[record.firstName, record.lastName].filter(Boolean).join(" ") || "Operational record"}</strong><span className="badge">{record.dataClassification ?? "Detection only"}</span></div><span>{record.medicalRecordNumber ?? record.resource ?? "record"} · {record.signal ?? "review"}</span><div className="form-actions"><button className="button secondary compact" onClick={() => void classify(record, "REAL")} type="button">{record.dataClassification === "REAL" ? "Mark Real" : "Restore"}</button><button className="button secondary compact" onClick={() => void classify(record, "TEST")} type="button">Mark Test</button><button className="button secondary compact" onClick={() => void classify(record, "NEEDS_REVIEW")} type="button">Mark Needs Review</button><button className="button secondary compact" onClick={() => void classify(record, "QUARANTINED")} type="button">Quarantine</button><button className="button secondary compact" type="button" disabled title="A governed patient-merge workflow with clinical-reference resolution is not configured.">Merge unavailable</button></div></article>)}{!records.length ? <p className="empty-state compact">No review candidates in this view.</p> : null}</div></section>
  </AppShell>;
}

async function request(path: string, method = "GET", payload?: object) {
  const token = sessionStorage.getItem("prijClinicToken");
  return fetch(`${getApiBaseUrl()}${path}`, { method, credentials: "include", headers: { ...(payload ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: payload ? JSON.stringify(payload) : undefined }).catch(() => new Response(null, { status: 503 }));
}

async function errorMessage(response: Response, fallback: string) { const body = await response.json().catch(() => null) as { error?: { message?: string; requestId?: string } } | null; return `${body?.error?.message ?? fallback}${body?.error?.requestId ? ` (Request ${body.error.requestId})` : ""}`; }
