"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../mvp-page";

type Encounter = {
  id: string;
  patientId: string;
  status: string;
  createdAt: string;
  startedAt?: string | null;
  patient?: { firstName?: string; lastName?: string; medicalRecordNumber?: string };
  doctor?: { displayName?: string };
};

export default function EncountersPage() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [status, setStatus] = useState("Loading encounters");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get("patientId");
    if (patientId) {
      window.location.replace(`/patients/${encodeURIComponent(patientId)}?tab=doctor-visit`);
      return;
    }
    void loadEncounters();
  }, []);

  async function loadEncounters() {
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/encounters`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : {} }).catch(() => null);
    if (!response?.ok) return setStatus("Encounter history is unavailable. Retry or open a patient file.");
    const data = await response.json() as { encounters?: Encounter[] };
    setEncounters(data.encounters ?? []);
    setStatus((data.encounters?.length ?? 0) ? "Ready" : "No encounters in your permitted scope");
  }

  const visible = useMemo(() => encounters.filter((encounter) => {
    if (statusFilter && encounter.status !== statusFilter) return false;
    const haystack = `${encounter.patient?.firstName ?? ""} ${encounter.patient?.lastName ?? ""} ${encounter.patient?.medicalRecordNumber ?? ""}`.toLocaleLowerCase();
    return !query.trim() || haystack.includes(query.trim().toLocaleLowerCase());
  }), [encounters, query, statusFilter]);

  return <AppShell>
    <section className="page-header"><div className="header-row"><div><p className="eyebrow">Clinical records</p><h1>Encounter history</h1><p className="muted">Browse prior visits here. Note editing remains in the patient Visit workspace.</p></div><Link className="button" href="/patients">Browse all patients</Link></div></section>
    <section className="panel">
      <div className="section-heading"><h2>Visits</h2><span className="badge">{status}</span></div>
      <div className="filter-row"><label>Patient or MRN<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Refine this list" /></label><label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="signed">Signed</option><option value="voided">Voided</option></select></label></div>
      <div className="data-list">{visible.map((encounter) => <article className="data-row" key={encounter.id}><div className="data-row-header"><strong>{[encounter.patient?.firstName, encounter.patient?.lastName].filter(Boolean).join(" ") || "Patient record"}</strong><span className="badge">{encounter.status}</span></div><p className="muted">MRN {encounter.patient?.medicalRecordNumber || "Not set"} · {formatDate(encounter.startedAt ?? encounter.createdAt)} · {encounter.doctor?.displayName || "Doctor attribution retained"}</p><Link className="button secondary compact" href={`/patients/${encodeURIComponent(encounter.patientId)}?tab=doctor-visit&encounterId=${encodeURIComponent(encounter.id)}`}>Open encounter</Link></article>)}{!visible.length ? <p className="empty-state compact">No encounters match these filters.</p> : null}</div>
    </section>
  </AppShell>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString();
}
