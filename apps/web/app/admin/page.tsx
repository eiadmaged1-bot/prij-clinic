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
  { href: "/admin/accounts", label: "Staff & permissions", description: "Accounts, roles, branches, and access", icon: "admin" },
  { href: "/admin/services", label: "Services & pricing", description: "Service catalog and reviewed prices", icon: "billing" },
  { href: "/admin/settings", label: "Clinic setup", description: "Clinic profile, branches, and rooms", icon: "settings" },
  { href: "/admin/audit", label: "Audit logs", description: "Redacted operational activity", icon: "timeline" },
  { href: "/admin/security-readiness", label: "Security readiness", description: "Readiness checks and blockers", icon: "consent" },
  { href: "/patients/import", label: "Data import", description: "Review patient spreadsheet imports", icon: "files" },
  { href: "/admin/medications", label: "Medication data", description: "Govern medication reference content", icon: "prescription" },
  { href: "/admin/investigations", label: "Investigation catalog", description: "Manage tests and categories", icon: "investigations" },
  { href: "/admin/appearance", label: "Appearance", description: "Accessible interface preferences", icon: "dashboard" },
  { href: "/admin/security-readiness", label: "Backup & sync", description: "Backup readiness and local sync status", icon: "reports" }
];

export default function OwnerControlPage() {
  const router = useRouter();
  const { user } = useSession();
  const [data, setData] = useState<OwnerControl | null>(null);
  const [clinicDate, setClinicDate] = useState("");
  const [patientQuery, setPatientQuery] = useState("");
  const [status, setStatus] = useState("Loading clinic overview");
  const [error, setError] = useState("");
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);

  const load = useCallback(async (date?: string) => {
    setStatus("Loading clinic overview");
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

  const primaryKpis = data ? [
    ["Today visits", metricValue(data.metrics.todayVisits), clinicDate],
    ["Active patients", metricValue(data.metrics.activePatients), "Current files"],
    ["Pending reviews", metricValue(data.metrics.pendingReviews), "Needs attention"],
    ["System alerts", metricValue(data.metrics.systemAlerts), "Operational blockers"]
  ] : [];

  const secondaryKpis = data ? [
    ["Active staff", metricValue(data.metrics.activeStaff)],
    ["Roles", metricValue(data.metrics.roles)],
    ["Active services", metricValue(data.metrics.activeServices)],
    ["Revenue today", revenueValue(data.metrics.revenueToday)]
  ] : [];

  return <AppShell>
    <section className="owner-control-header calm-owner-header">
      <div>
        <p className="eyebrow">Owner workspace</p>
        <h1>Clinic overview</h1>
        <p className="muted">Today’s flow, attention items, and management access.</p>
      </div>
      <div className="calm-owner-controls">
        <form className="owner-patient-search" onSubmit={searchPatient}>
          <label><span>Find patient</span><input value={patientQuery} onChange={(event) => setPatientQuery(event.target.value)} placeholder="Name, phone, MRN, or QR" /></label>
          <button className="button compact" type="submit"><ThreeDMedicalIcon name="search" size="sm" />Search</button>
        </form>
        <div className="owner-action-row">
          <Link className="button compact" href="/patients/new">Add patient</Link>
          <Link className="button secondary compact" href="/patients">Patient files</Link>
          <Link className="button secondary compact" href="/admin/accounts?create=1">Add staff</Link>
        </div>
        <div className="owner-context-row">
          <label>Clinic date<input type="date" value={clinicDate} onChange={(event) => { setClinicDate(event.target.value); void load(event.target.value); }} /></label>
          <span className="owner-account-chip"><ThreeDMedicalIcon name="admin" size="sm" tone="violet" />{user?.displayName ?? "Owner"}</span>
        </div>
      </div>
    </section>

    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {status.startsWith("Loading") ? <div className="skeleton" aria-label={status} /> : null}

    {data ? <>
      <section className="owner-kpi-grid calm-owner-kpis" aria-label="Owner clinic metrics">
        {primaryKpis.map(([label, value, detail]) => <article className="owner-kpi-card" key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}
      </section>

      <section className="owner-operations-grid calm-owner-operations">
        <article className="panel compact-panel owner-readiness-card">
          <div className="section-heading"><h2>Operational readiness</h2><span className={`badge ${data.readiness.checks.every((check) => check.passed) ? "accent" : "warning"}`}>{data.readiness.available ? `${data.readiness.checks.filter((check) => check.passed).length}/${data.readiness.checks.length}` : "Unavailable"}</span></div>
          <ul className="owner-check-list">{data.readiness.checks.map((check) => <li key={check.key}><span aria-hidden="true">{check.passed ? "✓" : "!"}</span>{check.label}</li>)}</ul>
          <Link className="button secondary compact" href="/admin/security-readiness">Review readiness</Link>
        </article>
        <article className="panel compact-panel">
          <div className="section-heading"><h2>Needs attention</h2><span className="badge">{data.pendingTasks.length}</span></div>
          {data.pendingTasks.length ? <div className="owner-task-list">{data.pendingTasks.map((task) => <Link href={task.href} key={task.label}><span>{task.label}</span><strong>{task.available ? task.count : "Unavailable"}</strong></Link>)}</div> : <p className="empty-state compact">Nothing waiting.</p>}
        </article>
      </section>

      <details className="panel calm-owner-disclosure">
        <summary><div><h2>Management tools</h2><p className="muted">Staff, services, settings, security, data, and appearance.</p></div><span className="badge">{managementCards.length}</span></summary>
        <div className="owner-management-grid">{managementCards.map((card) => <Link className="owner-management-card" href={card.href} key={`${card.href}-${card.label}`}><ThreeDMedicalIcon name={card.icon} size="sm" /><span><strong>{card.label}</strong><small>{card.description}</small></span></Link>)}</div>
      </details>

      <details className="panel calm-owner-disclosure">
        <summary><div><h2>Clinic details</h2><p className="muted">Secondary metrics, service setup, and recent audit.</p></div><span className="badge">Open</span></summary>
        <div className="calm-secondary-metrics">{secondaryKpis.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
        <section className="owner-operations-grid calm-owner-details-grid">
          <article className="compact-panel">
            <div className="section-heading"><div><h3>Services preview</h3><p className="muted">Five services maximum.</p></div><Link className="button secondary compact" href="/admin/services">Open services</Link></div>
            <div className="owner-service-table" role="table"><div className="owner-service-row owner-service-head" role="row"><span>Service</span><span>Category</span><span>Price</span><span>Status</span></div>{data.services.map((service) => <div className="owner-service-row" role="row" key={service.id}><strong>{service.name}</strong><span>{service.category}</span><span>{money(service.price, service.currency)}</span><span>{service.active ? "Active" : "Inactive"}</span></div>)}</div>
          </article>
          <article className="compact-panel">
            <div className="section-heading"><h3>Recent audit</h3><Link className="button secondary compact" href="/admin/audit">Open audit</Link></div>
            {data.recentAudit.length ? <div className="owner-audit-list">{data.recentAudit.map((entry) => <article key={entry.id}><strong>{humanize(entry.action)}</strong><span>{humanize(entry.resourceType)} · {new Date(entry.createdAt).toLocaleString()}</span><small>{entry.severity}</small></article>)}</div> : <p className="empty-state compact">No audit events available.</p>}
          </article>
        </section>
      </details>
    </> : null}
  </AppShell>;
}

function metricValue(metric: Metric) { return metric.available ? String(metric.value) : "Unavailable"; }
function revenueValue(metric: OwnerControl["metrics"]["revenueToday"]) { return !metric.configured ? "Not configured" : metric.available ? `${metric.value ?? "0.00"} ${metric.currency}` : "Unavailable"; }
function money(value: string | null, currency: string) { return value === null ? "Not set" : `${value} ${currency}`; }
function humanize(value: string) { return value.replaceAll("_", " ").replaceAll(".", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
