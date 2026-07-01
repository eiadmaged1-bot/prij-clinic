import type { ReactNode } from "react";
import Link from "next/link";

type Tone = "neutral" | "teal" | "terracotta" | "success" | "warning" | "danger";

export function ClinicShell({ children }: { children: ReactNode }) {
  return <div className="pc-clinic-shell">{children}</div>;
}

export function Sidebar({ children }: { children: ReactNode }) {
  return <aside className="sidebar">{children}</aside>;
}

export function Topbar({ children }: { children: ReactNode }) {
  return <header className="topbar">{children}</header>;
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <section className="page-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children}
    </section>
  );
}

export function SectionCard({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DataCard({ children }: { children: ReactNode }) {
  return <article className="data-row">{children}</article>;
}

export function KpiCard({ label, value, detail }: { label: string; value: ReactNode; detail?: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <p className="muted">{detail}</p> : null}
    </article>
  );
}

export function StatusChip({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  const className = tone === "teal" || tone === "success" ? "badge accent" : tone === "warning" || tone === "terracotta" ? "badge warning" : tone === "danger" ? "badge danger" : "badge";
  return <span className={className}>{children}</span>;
}

export function TrustBadge({ verified, source }: { verified?: boolean; source?: string }) {
  return (
    <span className={verified ? "badge accent" : "badge warning"}>
      {verified ? "Verified" : "Needs review"}
      {source ? ` · ${source}` : ""}
    </span>
  );
}

export function PatientHeader({
  name,
  meta,
  children
}: {
  name: string;
  meta?: string;
  children?: ReactNode;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <section className="patient-simple-hero">
      <div className="patient-avatar">{initials || "P"}</div>
      <div>
        <p className="eyebrow">Patient file</p>
        <h1>{name}</h1>
        {meta ? <p className="muted">{meta}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function PregnancyRibbon({ week }: { week?: number | null }) {
  if (!week || week < 1) return null;
  const clamped = Math.min(40, Math.max(1, week));
  return (
    <div className="pc-pregnancy-ribbon" aria-label={`Pregnancy week ${clamped} of 40`}>
      <span>Pregnancy week</span>
      <strong>{clamped} / 40</strong>
      <div>
        {Array.from({ length: 10 }).map((_, index) => (
          <i className={index < Math.ceil(clamped / 4) ? "active" : ""} key={index} />
        ))}
      </div>
    </div>
  );
}

export function TimelineRow({ time, title, detail }: { time?: string; title: string; detail?: string }) {
  return (
    <article className="timeline-item">
      <span className="pc-mono">{time ?? ""}</span>
      <span>
        <strong>{title}</strong>
        {detail ? <small className="muted">{detail}</small> : null}
      </span>
    </article>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="empty-state">{children}</p>;
}

export function ActionButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="button" href={href}>
      {children}
    </Link>
  );
}
