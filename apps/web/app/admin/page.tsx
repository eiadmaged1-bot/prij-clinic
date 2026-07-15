"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ThreeDMedicalIcon, type IconName } from "@/components/ThreeDMedicalIcon";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../mvp-page";
import { useSession } from "../session";

type Metric<T = number> = { available: true; value: T } | { available: false; value: null };
type OwnerControl = {
  clinicDate: string;
  metrics: {
    activeStaff: Metric;
    roles: Metric;
    activePatients: Metric;
    todayVisits: Metric;
    activeServices: Metric;
    pendingReviews: Metric;
    revenueToday: { available: boolean; configured: boolean; value: string | null; currency: string };
    systemAlerts: Metric;
  };
  readiness: { available: boolean; checks: Array<{ key: string; label: string; passed: boolean }> };
  pendingTasks: Array<{ label: string; href: string; available: boolean; count: number }>;
  services: Array<{ id: string; name: string; category: string; price: string | null; costAmount: string | null; doctorShareAmount: string | null; currency: string; active: boolean }>;
  recentAudit: Array<{ id: string; action: string; resourceType: string; severity: string; createdAt: string }>;
};

const managementCards: Array<{ href: string; label: string; description: string; icon: IconName }> = [
  { href: "/admin/accounts", label: "Staff & Permissions", description: "Accounts, roles, branches, and access", icon: "admin" },
  { href: "/admin/services", label: "Services & Pricing", description: "Service catalog and reviewed prices", icon: "billing" },
  { href: "/admin/settings", label: "Clinic Setup", description: "Clinic profile, branches, and rooms", icon: "settings" },
  { href: "/admin/audit", label: "Audit Logs", description: "Redacted operational activity", icon: "timeline" },
  { href: "/admin/security-readiness", label: "Security Readiness", description: "Real readiness checks and blockers", icon: "consent" },
  { href: "/patients/import", label: "Data Import", description: "Review patient spreadsheet imports", icon: "files" },
  { href: "/admin/medications", label: "Medication Data", description: "Govern medication reference content", icon: "prescription" },
  { href: "/admin/investigations", label: "Investigation Catalog", description: "Manage tests and categories", icon: "investigations" },
  { href: "/admin/appearance", label: "Appearance", description: "Accessible interface preferences", icon: "dashboard" },
  { href: "/admin/security-readiness", label: "Backup & Sync", description: "Backup readiness and local sync status", icon: "reports" }
];

export default function OwnerControlPage() {
  const router = useRouter();
  const { user } = useSession();
  const [data, setData] = useState<OwnerControl | null>(null);
  const [clinicDate, setClinicDate] = useState("");
  const [patientQuery, setPatientQuery] = useState("");
  const [status, setStatus] = useState("Loading Owner Control Center");
  const [error, setError] = useState("");
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);

  const load = useCallback(async (date?: string) => {
    setStatus("Loading Owner Control Center");
    setError("");
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    const response = await fetch(`${getApiBaseUrl()}/dashboard/owner-control?${params.toString()}`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined }).catch(() => null);
    if (!response?.ok) {
      setData(null);
      setStatus("");
      setError(response?.status === 403 ? "Owner access is required." : "Owner dashboard data is temporarily unavailable.");
      return;
    }
    const body = await response.json() as OwnerControl;
    setData(body);
    setClinicDate(body.clinicDate);
    setStatus("Ready");
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  function searchPatient(event: FormEvent) {
    event.preventDefault();
    const query = patientQuery.trim();
    router.push(query ? `/patients?search=${encodeURIComponent(query)}` : "/patients");
  }

  const kpis = data ? [
    ["Active staff", metricValue(data.metrics.activeStaff), "Active accounts"],
    ["Roles", metricValue(data.metrics.roles), "Configured roles"],
    ["Active patients", metricValue(data.metrics.activePatients), "Current active files"],
    ["Today visits", metricValue(data.metrics.todayVisits), clinicDate],
    ["Active services", metricValue(data.metrics.activeServices), "Available services"],
    ["Pending reviews", metricValue(data.metrics.pendingReviews), "Actionable categories"],
    ["Revenue collected today", revenueValue(data.metrics.revenueToday), "Recorded payments only"],
    ["System alerts", metricValue(data.metrics.systemAlerts), "Operational blockers"]
  ] : [];

  return <AppShell>
    <section className="owner-control-header">
      <div><p className="eyebrow">Owner workspace</p><h1>Owner Control Center</h1><p className="muted">Operational status from current clinic data.</p></div>
      <div className="owner-header-actions">
        <form className="owner-patient-search" onSubmit={searchPatient}><label><span>Global patient search</span><input value={patientQuery} onChange={(event) => setPatientQuery(event.target.value)} placeholder="Name, phone, MRN, or QR" /></label><button className="button compact" type="submit"><ThreeDMedicalIcon name="search" size="sm" />Search</button></form>
        <div className="owner-action-row"><Link className="button compact" href="/patients/new">Add Patient</Link><Link className="button secondary compact" href="/patients/import">Import Patients</Link><Link className="button secondary compact" href="/admin/accounts?create=1">Add Staff</Link></div>
        <div className="owner-context-row"><label>Clinic date<input type="date" value={clinicDate} onChange={(event) => { setClinicDate(event.target.value); void load(event.target.value); }} /></label><span className="owner-account-chip"><ThreeDMedicalIcon name="admin" size="sm" tone="violet" />{user?.displayName ?? "Owner"}</span></div>
      </div>
    </section>

    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {status.startsWith("Loading") ? <div className="skeleton" aria-label={status} /> : null}

    {data ? <>
      <section className="owner-kpi-grid" aria-label="Owner clinic metrics">{kpis.map(([label, value, detail]) => <article className="owner-kpi-card" key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</section>

      <section className="owner-operations-grid">
        <article className="panel compact-panel owner-readiness-card"><div className="section-heading"><h2>Operational readiness</h2><span className={`badge ${data.readiness.checks.every((check) => check.passed) ? "accent" : "warning"}`}>{data.readiness.available ? `${data.readiness.checks.filter((check) => check.passed).length}/${data.readiness.checks.length} checks` : "Unavailable"}</span></div><ul className="owner-check-list">{data.readiness.checks.map((check) => <li key={check.key}><span aria-hidden="true">{check.passed ? "✓" : "!"}</span>{check.label}</li>)}</ul><Link className="button secondary compact" href="/admin/security-readiness">Review readiness</Link></article>
        <article className="panel compact-panel"><div className="section-heading"><h2>Pending tasks</h2><span className="badge">{data.pendingTasks.length}</span></div>{data.pendingTasks.length ? <div className="owner-task-list">{data.pendingTasks.map((task) => <Link href={task.href} key={task.label}><span>{task.label}</span><strong>{task.available ? task.count : "Unavailable"}</strong></Link>)}</div> : <p className="empty-state compact">No pending task categories.</p>}</article>
      </section>

      <section><div className="section-heading"><div><h2>Management</h2><p className="muted">Every destination opens a working management route.</p></div></div><div className="owner-management-grid">{managementCards.map((card) => <Link className="owner-management-card" href={card.href} key={`${card.href}-${card.label}`}><ThreeDMedicalIcon name={card.icon} size="sm" /><span><strong>{card.label}</strong><small>{card.description}</small></span></Link>)}</div></section>

      <section className="owner-operations-grid">
        <article className="panel compact-panel"><div className="section-heading"><div><h2>Services preview</h2><p className="muted">Five services maximum. Edit in Services & Pricing.</p></div><Link className="button secondary compact" href="/admin/services">Open services</Link></div><div className="owner-service-table" role="table"><div className="owner-service-row owner-service-head" role="row"><span>Service</span><span>Category</span><span>Price</span><span>Cost</span><span>Doctor share</span><span>Status</span></div>{data.services.map((service) => <div className="owner-service-row" role="row" key={service.id}><strong>{service.name}</strong><span>{service.category}</span><span>{money(service.price, service.currency)}</span><span>{money(service.costAmount, service.currency)}</span><span>{money(service.doctorShareAmount, service.currency)}</span><span>{service.active ? "Active" : "Inactive"}</span></div>)}</div></article>
        <article className="panel compact-panel"><div className="section-heading"><h2>Recent audit</h2><Link className="button secondary compact" href="/admin/audit">Open audit</Link></div>{data.recentAudit.length ? <div className="owner-audit-list">{data.recentAudit.map((entry) => <article key={entry.id}><strong>{humanize(entry.action)}</strong><span>{humanize(entry.resourceType)} · {new Date(entry.createdAt).toLocaleString()}</span><small>{entry.severity}</small></article>)}</div> : <p className="empty-state compact">No audit events available.</p>}</article>
      </section>
    </> : null}
  </AppShell>;
}

function metricValue(metric: Metric) { return metric.available ? String(metric.value) : "Unavailable"; }
function revenueValue(metric: OwnerControl["metrics"]["revenueToday"]) { return !metric.configured ? "Not configured" : metric.available ? `${metric.value ?? "0.00"} ${metric.currency}` : "Unavailable"; }
function money(value: string | null, currency: string) { return value === null ? "Not set" : `${value} ${currency}`; }
function humanize(value: string) { return value.replaceAll("_", " ").replaceAll(".", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
