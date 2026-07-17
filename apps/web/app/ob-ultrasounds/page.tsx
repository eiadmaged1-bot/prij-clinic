"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../mvp-page";
import { useI18n } from "../../i18n/useI18n";

type Scan = { id: string; patientId: string; status: string; performedAt: string; clinicalContext?: string; cycleDay?: number | null; scanType?: string | null; gestationalAgeDisplay?: string | null; impressionText?: string | null; structuredFindingsJson?: Record<string, unknown> | null; fetalHeartRateBpm?: number | null; bpdMm?: number | null; hcMm?: number | null; acMm?: number | null; flMm?: number | null; patient?: { firstName?: string; lastName?: string; medicalRecordNumber?: string; patientType?: string }; branch?: { name?: string | null }; createdByUser?: { displayName?: string | null } };
const PAGE_SIZE = 20;

export default function ObUltrasoundsPage() {
  const { t, language } = useI18n();
  const [scans, setScans] = useState<Scan[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("loading");
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
    setStatus("loading");
    const response = await fetch(`${getApiBaseUrl()}/ob-ultrasounds?${params}`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : {} }).catch(() => null);
    if (!response?.ok) return setStatus("unavailable");
    const data = await response.json() as { obUltrasounds?: Scan[]; pageInfo?: { page: number; total: number; hasMore: boolean } };
    setScans(data.obUltrasounds ?? []);
    setPageInfo(data.pageInfo ?? { page, total: data.obUltrasounds?.length ?? 0, hasMore: false });
    setStatus((data.obUltrasounds?.length ?? 0) ? "ready" : "empty");
  }

  const selectQueue = (nextStatus: string, date = "") => { setStatusFilter(nextStatus); setDateFilter(date); setPage(1); };
  return <AppShell>
    <section className="page-header"><div className="header-row"><div><p className="eyebrow">{t("patientCenteredImaging")}</p><h1>{t("ultrasoundWorkspace")}</h1><p className="muted">{t("operationalRealScansOnly")}</p></div><Link className="button" href="/patients">{t("selectPatient")}</Link></div></section>
    <section className="content-grid ultrasound-center-grid"><article className="panel"><div className="section-heading"><div><h2>{t("previousScans")}</h2><p className="muted">{t("serverPaginatedImaging")}</p></div><span className="badge">{status === "loading" ? t("loadingScans") : status === "unavailable" ? t("ultrasoundHistoryUnavailable") : status === "empty" ? t("noScansPermitted") : t("ready")}</span></div>
      <div className="segmented-control" aria-label={t("ultrasoundQueues")}><button className={!statusFilter && Boolean(dateFilter) ? "active" : ""} type="button" onClick={() => selectQueue("", today())}>{t("today")}</button><button className={statusFilter === "draft" ? "active" : ""} type="button" onClick={() => selectQueue("draft")}>{t("drafts")}</button><button className={statusFilter === "needs_review" ? "active" : ""} type="button" onClick={() => selectQueue("needs_review")}>{t("needsReview")}</button><button className={statusFilter === "signed" ? "active" : ""} type="button" onClick={() => selectQueue("signed")}>{t("signed")}</button><button className={statusFilter === "incomplete" ? "active" : ""} type="button" onClick={() => selectQueue("incomplete")}>{t("incomplete")}</button><button className={statusFilter === "amended" ? "active" : ""} type="button" onClick={() => selectQueue("amended")}>{t("amended")}</button><button className={!statusFilter && !dateFilter ? "active" : ""} type="button" onClick={() => selectQueue("", "")}>{t("all")}</button></div>
      <div className="toolbar"><label><span>{t("patientMrnScanType")}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("refineScanHistory")} /></label><label><span>{t("patientType")}</span><select value={patientTypeFilter} onChange={(event) => { setPatientTypeFilter(event.target.value); setPage(1); }}><option value="">{t("allPatientTypes")}</option><option value="OBSTETRIC">{t("obstetric")}</option><option value="HIGH_RISK_OBSTETRIC">{t("highRiskObstetric")}</option><option value="GYNECOLOGY">{t("gynecology")}</option><option value="INFERTILITY">{t("infertility")}</option><option value="POSTPARTUM">{t("postpartum")}</option><option value="PREVENTIVE_WELL_WOMAN">{t("preventive")}</option><option value="OTHER">{t("other")}</option></select></label><label><span>{t("context")}</span><select value={contextFilter} onChange={(event) => { setContextFilter(event.target.value); setPage(1); }}><option value="">{t("obGynFertility")}</option><option value="OB">{t("obstetric")}</option><option value="GYN">{t("gynecology")}</option><option value="FERTILITY">{t("infertility")}</option></select></label><label><span>{t("doctorOperator")}</span><input value={doctorFilter} onChange={(event) => setDoctorFilter(event.target.value)} /></label><label><span>{t("branch")}</span><input value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)} /></label><label><span>{t("date")}</span><input type="date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1); }} /></label><button className="button secondary compact" type="button" onClick={() => { setPage(1); void load(); }}>{t("search")}</button></div>
      <div className="table-scroll"><table><thead><tr><th>{t("patientMrn")}</th><th>{t("context")}</th><th>{t("scan")}</th><th>{t("gaCycle")}</th><th>{t("date")}</th><th>{t("doctor")}</th><th>{t("branch")}</th><th>{t("completeness")}</th><th>{t("status")}</th><th>{t("action")}</th></tr></thead><tbody>{scans.map((scan) => <tr key={scan.id}><td><strong>{[scan.patient?.firstName, scan.patient?.lastName].filter(Boolean).join(" ") || t("patientRecord")}</strong><br /><span className="muted">{scan.patient?.medicalRecordNumber || t("mrnUnavailable")}</span></td><td>{scan.clinicalContext ?? "OB"}<br /><span className="muted">{formatPatientType(scan.patient?.patientType, language)}</span></td><td>{scan.scanType || t("notSet")}</td><td>{scan.clinicalContext === "FERTILITY" ? `${t("cycleDay")} ${scan.cycleDay ?? t("notRecorded")}` : scan.gestationalAgeDisplay || t("notRecorded")}</td><td>{formatDate(scan.performedAt, language, t("dateUnavailable"))}</td><td>{scan.createdByUser?.displayName || t("operatorNotShown")}</td><td>{scan.branch?.name || t("branchNotShown")}</td><td><span className="badge">{scanCompleteness(scan) ? t("ready") : t("incomplete")}</span></td><td><span className="badge">{localizedScanStatus(scan.status, language)}</span></td><td><Link className="button secondary compact" href={`/patients/${encodeURIComponent(scan.patientId)}/ultrasounds/${encodeURIComponent(scan.id)}`}>{t("openPatientUltrasound")}</Link></td></tr>)}{!scans.length ? <tr><td colSpan={10}><p className="empty-state compact">{t("noScansMatch")}</p></td></tr> : null}</tbody></table></div>
      <div className="form-actions"><button className="button secondary compact" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} type="button">{t("previous")}</button><span>{resultRange(pageInfo.page, pageInfo.total)} {t("of")} {pageInfo.total} {t("scans")}</span><button className="button secondary compact" disabled={!pageInfo.hasMore} onClick={() => setPage((value) => value + 1)} type="button">{t("next")}</button></div>
    </article></section>
  </AppShell>;
}

function formatDate(value: string, language: "en" | "ar", fallback: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-GB"); }
function today() { return new Date().toISOString().slice(0, 10); }
function scanCompleteness(scan: Scan) { const structured = scan.structuredFindingsJson && Object.keys(scan.structuredFindingsJson).length > 0; const measured = Boolean(scan.fetalHeartRateBpm || scan.bpdMm || scan.hcMm || scan.acMm || scan.flMm); return Boolean(scan.scanType && (structured || measured || scan.impressionText?.trim())); }
function formatPatientType(value: string | undefined, language: "en" | "ar") { const labels: Record<string, [string, string]> = { OBSTETRIC: ["Obstetric", "حمل وولادة"], HIGH_RISK_OBSTETRIC: ["High-risk obstetric", "حمل عالي الخطورة"], GYNECOLOGY: ["Gynecology", "أمراض النساء"], INFERTILITY: ["Infertility", "تأخر الإنجاب"], POSTPARTUM: ["Postpartum", "ما بعد الولادة"], PREVENTIVE_WELL_WOMAN: ["Preventive", "وقائي"], OTHER: ["Other", "أخرى"], OB: ["Obstetric", "حمل وولادة"], GYN: ["Gynecology", "أمراض النساء"], FERTILITY: ["Infertility", "تأخر الإنجاب"] }; return (labels[String(value ?? "OTHER").toUpperCase()] ?? labels.OTHER)![language === "ar" ? 1 : 0]; }
function localizedScanStatus(value: string, language: "en" | "ar") { const labels: Record<string, [string, string]> = { draft: ["Draft", "مسودة"], needs_review: ["Needs review", "تحتاج مراجعة"], reviewed: ["Reviewed", "تمت المراجعة"], signed: ["Signed", "موقّع"], incomplete: ["Incomplete", "غير مكتمل"], amended: ["Amended", "معدّل"] }; return (labels[value.toLowerCase()] ?? [value.replaceAll("_", " "), value.replaceAll("_", " ")])[language === "ar" ? 1 : 0]; }
function resultRange(page: number, total: number) { if (!total) return "0"; const start = (page - 1) * PAGE_SIZE + 1; return `${start}-${Math.min(total, start + PAGE_SIZE - 1)}`; }
