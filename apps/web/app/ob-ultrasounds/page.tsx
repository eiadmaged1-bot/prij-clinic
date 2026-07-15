"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../mvp-page";
import { useI18n } from "../../i18n/useI18n";

const scanTypes = ["Dating", "Viability", "NT / first trimester", "Anomaly", "Growth", "Doppler", "Cervical length", "Follow-up", "Folliculometry"];
type Scan = { id: string; patientId: string; status: string; performedAt: string; clinicalContext?: string; cycleDay?: number | null; scanType?: string | null; gestationalAgeDisplay?: string | null; impressionText?: string | null; patient?: { firstName?: string; lastName?: string; medicalRecordNumber?: string }; pregnancy?: { estimatedDueDate?: string | null; fetuses?: unknown[] }; fetus?: { label?: string } };

export default function ObUltrasoundsPage() {
  const { t } = useI18n();
  const [scans, setScans] = useState<Scan[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Loading scans");
  const [statusFilter, setStatusFilter] = useState("");
  const [contextFilter, setContextFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageInfo, setPageInfo] = useState({ page: 1, total: 0, hasMore: false });

  useEffect(() => { void load(); }, [page]);
  async function load() {
    const token = sessionStorage.getItem("prijClinicToken");
    const params = new URLSearchParams({ page: String(page), limit: "20" }); if (query.trim()) params.set("q", query.trim()); if (statusFilter) params.set("status", statusFilter); if (contextFilter) params.set("context", contextFilter);
    const response = await fetch(`${getApiBaseUrl()}/ob-ultrasounds?${params}`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : {} }).catch(() => null);
    if (!response?.ok) return setStatus("Ultrasound history is unavailable. Retry or open a patient file.");
    const data = await response.json() as { obUltrasounds?: Scan[]; pageInfo?: { page: number; total: number; hasMore: boolean } };
    setScans(data.obUltrasounds ?? []);
    setPageInfo(data.pageInfo ?? { page, total: data.obUltrasounds?.length ?? 0, hasMore: false });
    setStatus((data.obUltrasounds?.length ?? 0) ? "Ready" : "No scans in your permitted scope");
  }

  const visible = useMemo(() => scans, [scans]);

  return <AppShell>
    <section className="page-header"><div className="header-row"><div><p className="eyebrow">{t("patientCenteredImaging")}</p><h1>{t("ultrasoundWorkspace")}</h1><p className="muted">{t("ultrasoundWorkspaceHelp")}</p></div><Link className="button" href="/patients">{t("selectPatient")}</Link></div></section>
    <section className="content-grid">
      <article className="panel"><div className="section-heading"><div><h2>{t("supportedScanWorkflows")}</h2><p className="muted">{t("structuredRecording")}</p></div><span className="badge">{t("noAutomaticDiagnosis")}</span></div><div className="visit-type-counts">{scanTypes.map((type) => <span key={type}>{type}</span>)}</div><p className="notice">{t("scanWorkflowNotice")}</p></article>
      <article className="panel"><div className="section-heading"><div><h2>{t("previousScans")}</h2><p className="muted">{t("latestRealRecords")}</p></div><span className="badge">{status}</span></div><div className="toolbar"><label>{t("patientMrnScanType")}<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("refineScanHistory")} /></label><label>Context<select value={contextFilter} onChange={(event) => { setContextFilter(event.target.value); setPage(1); }}><option value="">OB, GYN and Fertility</option><option value="OB">Obstetric</option><option value="GYN">Gynecology</option><option value="FERTILITY">Fertility</option></select></label><label>Status<select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="">All</option><option value="draft">Draft / incomplete</option><option value="reviewed">Needs review / reviewed</option><option value="signed">Signed</option></select></label><button className="button secondary compact" type="button" onClick={() => void load()}>Search</button></div><div className="data-list">{visible.map((scan) => <article className="data-row" key={scan.id}><div className="data-row-header"><strong>{[scan.patient?.firstName, scan.patient?.lastName].filter(Boolean).join(" ") || "Patient record"}</strong><span className="badge">{scan.status}</span></div><p className="muted">{scan.clinicalContext ?? "OB"} · {scan.scanType || "Scan type not set"} · {scan.clinicalContext === "FERTILITY" ? `Cycle day ${scan.cycleDay ?? "not recorded"}` : scan.gestationalAgeDisplay || "Context details not recorded"} · {formatDate(scan.performedAt)}</p><Link className="button secondary compact" href={`/patients/${encodeURIComponent(scan.patientId)}?tab=ultrasound&scanId=${encodeURIComponent(scan.id)}`}>{t("openPatientUltrasound")}</Link></article>)}{!visible.length ? <p className="empty-state compact">{t("noScansMatch")}</p> : null}</div><div className="form-actions"><button className="button secondary compact" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} type="button">Previous</button><span>Page {pageInfo.page} · {pageInfo.total} scans</span><button className="button secondary compact" disabled={!pageInfo.hasMore} onClick={() => setPage((value) => value + 1)} type="button">Next</button></div></article>
    </section>
  </AppShell>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString();
}
