"use client";

import type { ReactNode } from "react";
import { ThreeDMedicalIcon, type IconName } from "../ThreeDMedicalIcon";

export function PatientWorkspaceShell({ children }: { children: ReactNode }) {
  return <section className="patient-workspace-shell">{children}</section>;
}

export function PatientHeader({
  title,
  subtitle,
  status,
  children
}: {
  title: string;
  subtitle: string;
  status?: string;
  children?: ReactNode;
}) {
  return (
    <section className="patient-simple-hero">
      <div className="patient-avatar">
        <ThreeDMedicalIcon name="patients" size="lg" />
      </div>
      <div>
        <p className="eyebrow">Patient file</p>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
      </div>
      <div className="patient-primary-actions">
        {children}
        {status ? <span className="badge">{status}</span> : null}
      </div>
    </section>
  );
}

export function PatientTabs({
  tabs,
  activeKey,
  onChange
}: {
  tabs: Array<{ key: string; label: string; icon: IconName }>;
  activeKey: string;
  onChange: (key: string) => void;
}) {
  return (
    <section className="patient-tabs simple" aria-label="Patient file sections">
      {tabs.map((tab) => (
        <button className={`tab-button ${activeKey === tab.key ? "active" : ""}`} key={tab.key} onClick={() => onChange(tab.key)} type="button">
          <ThreeDMedicalIcon name={tab.icon} size="sm" />
          {tab.label}
        </button>
      ))}
    </section>
  );
}

export function PatientTimelineRail({ children }: { children: ReactNode }) {
  return <aside className="patient-timeline-rail">{children}</aside>;
}

export function PatientQuickActions({ children }: { children: ReactNode }) {
  return (
    <section className="patient-action-strip" aria-label="Patient quick actions">
      {children}
    </section>
  );
}

export function PatientContextBar({ children }: { children: ReactNode }) {
  return <section className="patient-context-bar">{children}</section>;
}
