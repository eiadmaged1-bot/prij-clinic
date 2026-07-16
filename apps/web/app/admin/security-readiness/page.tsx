"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell, SafetyAlert } from "../../mvp-page";
import { useSession } from "../../session";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { useI18n } from "../../../i18n/useI18n";

type ReadinessSection = {
  label: string;
  status: string;
  detail: string;
  checkType?: "Automated" | "Manual" | "Mixed";
  owner?: string;
  blocker?: string;
  action?: string;
};

type SecurityReadiness = {
  generatedAt: string;
  status: string;
  sections: ReadinessSection[];
  blockers: string[];
};

const fallbackSections: ReadinessSection[] = [
  { label: "Authentication readiness", status: "Review", detail: "Sign in with Owner/Admin access to load the protected readiness review." },
  { label: "Role access readiness", status: "Review", detail: "Role boundaries are checked by access guards and regression scripts." },
  { label: "Audit readiness", status: "Review", detail: "Audit governance checks must pass before real patient data entry." },
  { label: "Document upload safety", status: "Review", detail: "Upload allowlists and metadata sanitization stay part of the readiness gate." },
  { label: "Backup readiness", status: "Review", detail: "Local backup scripts are available; production backup operations still require deployment setup." },
  { label: "Consent readiness or limitation", status: "Limited", detail: "Consent tracking exists, but legal review and clinic policy approval remain required." },
  { label: "Production environment readiness", status: "Review", detail: "Production environment validation must pass without exposing secret values." },
  { label: "Seed/data safety", status: "Review", detail: "No real patient data or fake clinical patient data should be present in seed flows." },
  { label: "PHI/PII protection", status: "Review", detail: "Storage paths, technical errors, and internal identifiers should stay out of normal UI." },
  { label: "AI safety status", status: "Draft-only", detail: "AI stays assistive and doctor-reviewed only." }
];

export default function SecurityReadinessPage() {
  const { t } = useI18n();
  const { status, isAdmin } = useSession();
  const [readiness, setReadiness] = useState<SecurityReadiness | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const apiBaseUrl = useMemo(() => (typeof window === "undefined" ? "" : getApiBaseUrl()), []);

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) {
      setLoading(false);
      setReadiness(null);
      return;
    }

    async function loadReadiness() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${apiBaseUrl}/admin/security-readiness`, {
          credentials: "include"
        });
        if (response.status === 401 || response.status === 403) {
          setError("Owner/Admin access is required to review security readiness.");
          setReadiness(null);
          return;
        }
        if (!response.ok) {
          setError("Security readiness is unavailable right now.");
          setReadiness(null);
          return;
        }
        setReadiness((await response.json()) as SecurityReadiness);
      } catch {
        setError("Security readiness is unavailable right now.");
        setReadiness(null);
      } finally {
        setLoading(false);
      }
    }

    void loadReadiness();
  }, [apiBaseUrl, isAdmin, status]);

  const sections = readiness?.sections ?? fallbackSections;
  const blockers = readiness?.blockers ?? [
    "Owner/Admin review is required before enabling real patient data.",
    "Production deployment, backups, consent policy, and legal review remain separate readiness gates."
  ];

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Owner/Admin</p>
            <h1>Security Readiness</h1>
          </div>
          <span className="badge warning">Readiness review</span>
        </div>
        <p className="muted">Real patient data readiness gates for authentication, access control, audit, backups, documents, production settings, and AI safety.</p>
      </section>

      <SafetyAlert />

      {!isAdmin && status !== "loading" ? <p className="form-error">Owner/Admin access is required to open this readiness review.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <div className="skeleton" /> : null}

      <section className="summary-grid">
        <Metric label="Overall status" value={readiness ? "Review required" : "Protected"} />
        <Metric label="Readiness areas" value={sections.length} />
        <Metric label="Remaining blockers" value={blockers.length} />
        <Metric label="AI status" value="Draft-only" />
      </section>

      <section className="panel"><div className="section-heading"><h2>{t("securityMatrix")}</h2><span className="badge">{t("evidence")}, {t("owner")}, {t("blocker")}, {t("action")}</span></div><div className="table-scroll"><table><thead><tr><th>{t("area")}</th><th>Status</th><th>{t("automatedManual")}</th><th>{t("evidence")}</th><th>{t("owner")}</th><th>{t("lastChecked")}</th><th>{t("blocker")}</th><th>{t("action")}</th></tr></thead><tbody>{sections.map((section) => <tr key={section.label}><td><strong>{section.label}</strong></td><td><span className={`badge ${badgeTone(section.status)}`}>{section.status}</span></td><td>{section.checkType ?? readinessCheckType(section.label)}</td><td><details><summary>View evidence</summary><p className="muted">{section.detail}</p></details></td><td>{section.owner ?? readinessOwner(section.label)}</td><td>{readiness?.generatedAt ? new Date(readiness.generatedAt).toLocaleString() : "Not checked in this session"}</td><td>{section.blocker ?? (section.status === "Configured" || section.status === "Guarded" ? "None recorded" : "Owner review required")}</td><td>{section.action ?? readinessAction(section.label)}</td></tr>)}</tbody></table></div></section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Remaining blockers before real patient data</h2>
            <p className="muted">v0.16.0 prepares readiness checks. It is not a production or legal readiness claim.</p>
          </div>
          <span className="badge danger">Blocked until reviewed</span>
        </div>
        <ul className="feature-list">
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
        <div className="form-actions">
          <Link className="button secondary" href="/admin/audit">Audit Log</Link>
          <Link className="button secondary" href="/admin/settings">Clinic Settings</Link>
          <Link className="button secondary" href="/admin/accounts">Users and Roles</Link>
        </div>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p className="muted">Security readiness</p>
    </article>
  );
}

function badgeTone(status: string) {
  const value = status.toLowerCase();
  if (value.includes("configured") || value.includes("guarded")) return "accent";
  if (value.includes("limited") || value.includes("local") || value.includes("draft")) return "warning";
  return "";
}

function readinessCheckType(label: string) { return /consent|backup|production/i.test(label) ? "Mixed" : "Automated"; }
function readinessOwner(label: string) { return /consent/i.test(label) ? "Clinic Owner / legal reviewer" : /backup|production/i.test(label) ? "Deployment Owner" : "Clinic Owner / Admin"; }
function readinessAction(label: string) { if (/backup/i.test(label)) return "Run and evidence a restore drill"; if (/consent/i.test(label)) return "Complete clinic policy and legal review"; if (/production/i.test(label)) return "Run production readiness validation"; return "Review current evidence and blockers"; }
