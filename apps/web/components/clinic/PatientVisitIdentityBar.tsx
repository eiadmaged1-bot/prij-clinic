"use client";

import { ReactNode } from "react";
import { ThreeDMedicalIcon } from "../ThreeDMedicalIcon";

export type PatientVisitIdentity = {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  medicalRecordNumber?: string | null;
  dateOfBirth?: string | null;
  patientType?: string | null;
  pregnancyStatus?: string | null;
};

export type VisitIdentity = {
  id: string;
  status?: string | null;
  visitType?: string | null;
  startedAt?: string | null;
};

export function PatientVisitIdentityBar({
  patient,
  visit,
  error,
  actions
}: {
  patient?: PatientVisitIdentity | null;
  visit?: VisitIdentity | null;
  error?: string;
  actions?: ReactNode;
}) {
  if (error || !patient || !visit) {
    return (
      <section className="patient-visit-identity-bar blocked" data-patient-context-required>
        <ThreeDMedicalIcon name="patients" size="sm" tone="rose" />
        <div>
          <strong>Patient context is required before documenting this visit.</strong>
          <span>{error ?? "Open a patient and active visit before documenting."}</span>
        </div>
      </section>
    );
  }

  const displayName = patient.name || `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim() || "Patient";
  const age = patient.dateOfBirth ? `${calculateAge(patient.dateOfBirth)}y` : "YOB not recorded";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "PT";

  return (
    <section className="patient-visit-identity-bar" data-locked-patient-bar>
      <div className="patient-avatar" aria-hidden="true">{initials}</div>
      <div className="identity-main">
        <strong>{displayName}</strong>
        <span>{age} | MRN {patient.medicalRecordNumber ?? "not recorded"} | {patientTypeLabel(patient.patientType)}</span>
      </div>
      <div className="identity-meta">
        <span className="badge">{visit.visitType ?? "Visit"}</span>
        <span className="badge accent">{visit.status ?? "draft"}</span>
        {patient.pregnancyStatus ? <span className="badge">{patient.pregnancyStatus}</span> : null}
        <span className="badge lock-badge"><ThreeDMedicalIcon name="files" size="sm" />Locked patient</span>
      </div>
      {actions ? <div className="identity-actions" style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", alignItems: "center" }}>{actions}</div> : null}
    </section>
  );
}

function calculateAge(dateOfBirth: string) {
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return "?";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) age -= 1;
  return Math.max(age, 0);
}

function patientTypeLabel(value?: string | null) {
  if (value === "OB") return "Obstetric / Pregnancy";
  if (value === "GYN") return "Gynecology";
  if (value === "INFERTILITY") return "Infertility";
  if (value === "WOMEN_HEALTH") return "Women's Health";
  return value || "Unclassified";
}
