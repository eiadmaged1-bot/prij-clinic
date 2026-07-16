import Link from "next/link";
import { ageLabel, patientTypeLabel, patientTypeSemanticClass } from "@/lib/patient-labels";
import type { Patient, ClinicalPhase, InfertilityWorkspace } from "@/app/patients/[id]/patient-components";

type Row = Record<string, unknown>;

export function PatientSmartIdentityBar({ patient, currentPhase, related, infertility, autosaveStatus, onOpenVisit, onOpenMore }: {
  patient: Patient;
  currentPhase?: ClinicalPhase | null;
  related: Record<string, Row[]>;
  infertility: InfertilityWorkspace;
  autosaveStatus: string;
  onOpenVisit: () => void;
  onOpenMore: () => void;
}) {
  const queue = related.queue?.[0];
  const pregnancy = related.pregnancy?.find((row) => String(row.status ?? "").toUpperCase() === "ACTIVE") ?? related.pregnancy?.[0];
  const allergies = related.allergies;
  const ga = gestationalAge(pregnancy);
  const cycleDay = firstValue(infertility, ["cycleDay", "currentCycleDay"]);
  const doctor = firstValue(queue, ["doctorName", "assignedDoctorName", "doctor"]);
  const branch = firstValue(queue, ["branchName"]) || patient.branchId;
  const queueState = firstValue(queue, ["status"]);
  const visitType = firstValue(queue, ["visitType"]);

  return <section className={`patient-smart-identity-bar ${patientTypeSemanticClass(patient.patientType)}`} aria-label="Current patient and clinical context">
    <div className="patient-smart-primary">
      <strong>{patient.firstName} {patient.lastName}</strong>
      <span>MRN {patient.medicalRecordNumber}</span>
      <span>{ageLabel(patient.dateOfBirth)}</span>
      <span>{patient.phone || "Phone not recorded"}</span>
    </div>
    <div className="patient-smart-signals">
      <span className="patient-type-badge">{patientTypeLabel(patient.patientType)}</span>
      <span>{currentPhase ? `Active phase: ${currentPhase.phaseType}` : "Active phase needs review"}</span>
      <span>{visitType ? `Visit: ${visitType}` : "No active visit type"}</span>
      <span>{queueState ? `Queue: ${queueState}` : "Not in today’s queue"}</span>
      <span className={allergies === undefined ? "warning" : ""}>{allergies === undefined ? "Allergies unavailable" : allergies.length ? `Allergies: ${allergies.length} recorded` : "No recorded allergies"}</span>
      {ga ? <span>GA {ga}</span> : null}
      {pregnancy && firstValue(pregnancy, ["edd", "estimatedDueDate"]) ? <span>EDD {formatDate(firstValue(pregnancy, ["edd", "estimatedDueDate"]))}</span> : null}
      {cycleDay ? <span>Cycle day {cycleDay}</span> : null}
      {patientTypeLabel(patient.patientType).startsWith("High-risk") ? <span className="risk">High-risk status recorded</span> : null}
      <span>{doctor ? `Doctor: ${doctor}` : "Doctor not assigned"}</span>
      <span>{branch ? `Branch: ${branch}` : "Branch unavailable"}</span>
      <span>{autosaveStatus}</span>
    </div>
    <div className="patient-smart-actions">
      <button className="button compact" type="button" onClick={onOpenVisit}>Start / Resume visit</button>
      <Link className="button secondary compact" href={`/patients/${patient.id}/workspace-editor`}>Edit workspace</Link>
      <button className="button secondary compact" type="button" onClick={onOpenMore}>More</button>
    </div>
  </section>;
}

function firstValue(value: unknown, keys: string[]): string {
  if (!value || typeof value !== "object") return "";
  const row = value as Row;
  for (const key of keys) if (row[key] !== undefined && row[key] !== null && String(row[key]).trim()) return String(row[key]);
  return "";
}

function gestationalAge(pregnancy?: Row) {
  if (!pregnancy) return "";
  const direct = firstValue(pregnancy, ["gestationalAge", "ga"]);
  if (direct) return direct;
  const edd = firstValue(pregnancy, ["edd", "estimatedDueDate"]);
  if (!edd) return "";
  const due = new Date(edd).getTime();
  if (!Number.isFinite(due)) return "";
  const days = 280 - Math.floor((due - Date.now()) / 86_400_000);
  if (days < 0 || days > 315) return "";
  return `${Math.floor(days / 7)}w ${days % 7}d`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString() : value;
}
