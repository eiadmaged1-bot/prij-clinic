"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../mvp-page";
import { useI18n } from "../../i18n/useI18n";

const scanTypes = ["Dating", "Viability", "NT / first trimester", "Anomaly", "Growth", "Doppler", "Cervical length", "Follow-up", "Folliculometry"];
type Scan = { id: string; patientId: string; status: string; performedAt: string; scanType?: string | null; gestationalAgeDisplay?: string | null; impressionText?: string | null; patient?: { firstName?: string; lastName?: string; medicalRecordNumber?: string }; pregnancy?: { estimatedDueDate?: string | null; fetuses?: unknown[] }; fetus?: { label?: string } };

export default function ObUltrasoundsPage() {
  const { t } = useI18n();
  const [scans, setScans] = useState<Scan[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Loading scans");

  useEffect(() => { void load(); }, []);
  async function load() {
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/ob-ultrasounds`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : {} }).catch(() => null);
    if (!response?.ok) return setStatus("Ultrasound history is unavailable. Retry or open a patient file.");
    const data = await response.json() as { obUltrasounds?: Scan[] };
    setScans(data.obUltrasounds ?? []);
    setStatus((data.obUltrasounds?.length ?? 0) ? "Ready" : "No scans in your permitted scope");
  }

  const visible = useMemo(() => scans.filter((scan) => `${scan.patient?.firstName ?? ""} ${scan.patient?.lastName ?? ""} ${scan.patient?.medicalRecordNumber ?? ""} ${scan.scanType ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [query, scans]);

  return <AppShell>
    <section className="page-header"><div className="header-row"><div><p className="eyebrow">{t("patientCenteredImaging")}</p><h1>{t("ultrasoundWorkspace")}</h1><p className="muted">{t("ultrasoundWorkspaceHelp")}</p></div><Link className="button" href="/patients">{t("selectPatient")}</Link></div></section>
    <section className="content-grid">
      <article className="panel"><div className="section-heading"><div><h2>{t("supportedScanWorkflows")}</h2><p className="muted">{t("structuredRecording")}</p></div><span className="badge">{t("noAutomaticDiagnosis")}</span></div><div className="visit-type-counts">{scanTypes.map((type) => <span key={type}>{type}</span>)}</div><p className="notice">{t("scanWorkflowNotice")}</p></article>
      <article className="panel"><div className="section-heading"><div><h2>{t("previousScans")}</h2><p className="muted">{t("latestRealRecords")}</p></div><span className="badge">{status}</span></div><label>{t("patientMrnScanType")}<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("refineScanHistory")} /></label><div className="data-list">{visible.map((scan) => <article className="data-row" key={scan.id}><div className="data-row-header"><strong>{[scan.patient?.firstName, scan.patient?.lastName].filter(Boolean).join(" ") || "Patient record"}</strong><span className="badge">{scan.status}</span></div><p className="muted">{scan.scanType || "Scan type not set"} · {scan.gestationalAgeDisplay || "GA not recorded"} · {scan.fetus?.label || "Pregnancy context"} · {formatDate(scan.performedAt)}</p><Link className="button secondary compact" href={`/patients/${encodeURIComponent(scan.patientId)}?tab=ultrasound&scanId=${encodeURIComponent(scan.id)}`}>{t("openPatientUltrasound")}</Link></article>)}{!visible.length ? <p className="empty-state compact">{t("noScansMatch")}</p> : null}</div></article>
    </section>
  </AppShell>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString();
}
