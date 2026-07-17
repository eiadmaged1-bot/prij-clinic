"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../mvp-page";
import { useI18n } from "../../i18n/useI18n";

type Scan = { id: string; patientId: string; status: string; performedAt: string; clinicalContext?: string; cycleDay?: number | null; scanType?: string | null; gestationalAgeDisplay?: string | null; impressionText?: string | null; structuredFindingsJson?: Record<string, unknown> | null; fetalHeartRateBpm?: number | null; bpdMm?: number | null; hcMm?: number | null; acMm?: number | null; flMm?: number | null; patient?: { firstName?: string; lastName?: string; medicalRecordNumber?: string; patientType?: string }; branch?: { name?: string | null }; createdByUser?: { displayName?: string | null } };
const PAGE_SIZE = 20;

export default function ObUltrasoundsPage() {
  const { t } = useI18n();
  const [scans, setScans] = useState<Scan[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Loading scans");
  const [statusFilter, setStatusFilter] = useState("");
  const [contextFilter, setContextFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [patientTypeFilter, setPatientTypeFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageInfo, setPageInfo] = useState({ page: 1, total: 0, hasMore: false });

  useEffect(() => { void load(); }, [page, statusFilter, contextFilter, dateFilter, patientTypeFilter]);
  async function load() {
    const token = sessionStorage.getItem("prijClinicToken");
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (query.trim()) params.set("q", query.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (contextFilter) params.set("context", contextFilter);
    if (dateFilter) params.set("date", dateFilter);
    if (doctorFilter.trim()) params.set("doctor", doctorFilter.trim());
    if (patientTypeFilter) params.set("patientType", patientTypeFilter);
    if (branchFilter.trim()) params.set("branch", branchFilter.trim());
    setStatus("Loading scans");
    const response = await fetch(`${getApiBaseUrl()}/ob-ultrasounds?${params}`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : {} }).catch(() => null);
    if (!response?.ok) return setStatus("Ultrasound history is unavailable. Retry or open a patient file.");
    const data = await response.json() as { obUltrasounds?: Scan[]; pageInfo?: { page: number; total: number; hasMore: boolean } };
    setScans(data.obUltrasounds ?? []);
    setPageInfo(data.pageInfo ?? { page, total: data.obUltrasounds?.length ?? 0, hasMore: false });
    setStatus((data.obUltrasounds?.length ?? 0) ? "Ready" : "No scans in your permitted scope");
  }

  const selectQueue = (nextStatus: string, date = "") => { setStatusFilter(nextStatus); setDateFilter(date); setPage(1); };
  return <AppShell>
    <section className="page-header"><div className="header-row"><div><p className="eyebrow">{t("patientCenteredImaging")}</p><h1>{t("ultrasoundWorkspace")}</h1><p className="muted">Operational REAL records only. Create scans from a selected patient and active encounter.</p></div><Link className="button" href="/patients">{t("selectPatient")}</Link></div></section>
    <section className="content-grid ultrasound-center-grid"><article className="panel"><div className="section-heading"><div><h2>{t("previousScans")}</h2><p className="muted">Server-paginated OB, gynecology, and fertility imaging workflow.</p></div><span className="badge">{status}</span></div>
      <div className="segmented-control" aria-label="Ultrasound work queues"><button className={!statusFilter && Boolean(dateFilter) ? "active" : ""} type="button" onClick={() => selectQueue("", today())}>Today</button><button className={statusFilter === "draft" ? "active" : ""} type="button" onClick={() => selectQueue("draft")}>Drafts</button><button className={statusFilter === "needs_review" ? "active" : ""} type="button" onClick={() => selectQueue("needs_review")}>Needs review</button><button className={statusFilter === "signed" ? "active" : ""} type="button" onClick={() => selectQueue("signed")}>Signed</button><button className={statusFilter === "incomplete" ? "active" : ""} type="button" onClick={() => selectQueue("incomplete")}>Incomplete</button><button className={statusFilter === "amended" ? "active" : ""} type="button" onClick={() => selectQueue("amended")}>Amended</button><button className={!statusFilter && !dateFilter ? "active" : ""} type="button" onClick={() => selectQueue("", "")}>All</button></div>
      <div className="toolbar"><label>{t("patientMrnScanType")}<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("refineScanHistory")} /></label><label>Patient type<select value={patientTypeFilter} onChange={(event) => { setPatientTypeFilter(event.target.value); setPage(1); }}><option value="">All patient types</option><option value="OBSTETRIC">Obstetric</option><option value="HIGH_RISK_OBSTETRIC">High-risk obstetric</option><option value="GYNECOLOGY">Gynecology</option><option value="INFERTILITY">Infertility</option><option value="POSTPARTUM">Postpartum</option><option value="PREVENTIVE_WELL_WOMAN">Preventive</option><option value="OTHER">Other</option></select></label><label>Context<select value={contextFilter} onChange={(event) => { setContextFilter(event.target.value); setPage(1); }}><option value="">OB, GYN and Fertility</option><option value="OB">Obstetric</option><option value="GYN">Gynecology</option><option value="FERTILITY">Fertility</option></select></label><label>Doctor / operator<input value={doctorFilter} onChange={(event) => setDoctorFilter(event.target.value)} /></label><label>Branch<input value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)} /></label><label>Date<input type="date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1); }} /></label><button className="button secondary compact" type="button" onClick={() => { setPage(1); void load(); }}>Search</button></div>
      <div className="table-scroll"><table><thead><tr><th>Patient / MRN</th><th>Context</th><th>Scan</th><th>GA / cycle</th><th>Date</th><th>Doctor</th><th>Branch</th><th>Completeness</th><th>Status</th><th>Action</th></tr></thead><tbody>{scans.map((scan) => <tr key={scan.id}><td><strong>{[scan.patient?.firstName, scan.patient?.lastName].filter(Boolean).join(" ") || "Patient record"}</strong><br /><span className="muted">{scan.patient?.medicalRecordNumber || "MRN unavailable"}</span></td><td>{scan.clinicalContext ?? "OB"}<br /><span className="muted">{formatPatientType(scan.patient?.patientType)}</span></td><td>{scan.scanType || "Not set"}</td><td>{scan.clinicalContext === "FERTILITY" ? `Cycle day ${scan.cycleDay ?? "not recorded"}` : scan.gestationalAgeDisplay || "Not recorded"}</td><td>{formatDate(scan.performedAt)}</td><td>{scan.createdByUser?.displayName || "Operator not shown"}</td><td>{scan.branch?.name || "Branch not shown"}</td><td><span className="badge">{scanCompleteness(scan)}</span></td><td><span className="badge">{scan.status.replaceAll("_", " ")}</span></td><td><Link className="button secondary compact" href={`/patients/${encodeURIComponent(scan.patientId)}/ultrasounds/${encodeURIComponent(scan.id)}`}>{t("openPatientUltrasound")}</Link></td></tr>)}{!scans.length ? <tr><td colSpan={10}><p className="empty-state compact">{t("noScansMatch")}</p></td></tr> : null}</tbody></table></div>
      <div className="form-actions"><button className="button secondary compact" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} type="button">Previous</button><span>{resultRange(pageInfo.page, pageInfo.total)} of {pageInfo.total} scans</span><button className="button secondary compact" disabled={!pageInfo.hasMore} onClick={() => setPage((value) => value + 1)} type="button">Next</button></div>
    </article></section>
  </AppShell>;
}

function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString(); }
function today() { return new Date().toISOString().slice(0, 10); }
function scanCompleteness(scan: Scan) { const structured = scan.structuredFindingsJson && Object.keys(scan.structuredFindingsJson).length > 0; const measured = Boolean(scan.fetalHeartRateBpm || scan.bpdMm || scan.hcMm || scan.acMm || scan.flMm); return scan.scanType && (structured || measured || scan.impressionText?.trim()) ? "Ready" : "Incomplete"; }
function formatPatientType(value?: string) { return value ? value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Type not recorded"; }
function resultRange(page: number, total: number) { if (!total) return "0"; const start = (page - 1) * PAGE_SIZE + 1; return `${start}-${Math.min(total, start + PAGE_SIZE - 1)}`; }
