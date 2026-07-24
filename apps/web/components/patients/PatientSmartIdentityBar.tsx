import { ageLabel, patientTypeLabel, patientTypeSemanticClass } from "@/lib/patient-labels";
import type { Patient, ClinicalPhase, InfertilityWorkspace, PatientWorkspaceContext } from "@/app/patients/[id]/patient-components";

type Row = Record<string, unknown>;

export function PatientSmartIdentityBar({ patient, currentPhase, related, workspaceContext }: {
  patient: Patient;
  currentPhase?: ClinicalPhase | null;
  related: Record<string, Row[]>;
  infertility: InfertilityWorkspace;
  workspaceContext: PatientWorkspaceContext;
  autosaveStatus: string;
}) {
  const pregnancy = workspaceContext.pregnancy;
  const allergies = related.allergies;
  const cycle = workspaceContext.cycle;
  const ga = gestationalAge(pregnancy);
  const cycleDay = firstValue(cycle, ["cycleDay", "currentCycleDay"]);
  const bloodGroup = normalizedBloodGroup(firstValue(patient, ["bloodGroup", "bloodType"]));
  const edd = pregnancy ? firstValue(pregnancy, ["edd", "estimatedDueDate"]) : "";
  const datingMethod = pregnancy ? firstValue(pregnancy, ["datingMethod"]) : "";
  const datingStatus = pregnancy ? firstValue(pregnancy, ["datingCertainty", "confidenceStatus"]) : "";
  const lmp = firstValue(pregnancy, ["lmp", "lmpDate"]) || firstValue(cycle, ["lmp", "lmpDate", "periodStart"]);
  const gravida = firstValue(pregnancy, ["gravida"]);
  const para = firstValue(pregnancy, ["para"]);
  const phaseLabel = workspaceContext.activePhase?.title || workspaceContext.activePhase?.phaseType.replaceAll("_", " ") || "";
  const specialtyFields = contextFields(workspaceContext.mode, {
    gravidaPara: gravida || para ? `${gravida || "Not recorded"} / ${para || "Not recorded"}` : "",
    ga,
    edd: edd ? formatDate(edd) : "",
    datingMethod,
    datingStatus,
    trimester: pregnancyTrimester(ga),
    lmp: lmp ? formatDate(lmp) : "",
    cycleDay: cycleDay ? `Day ${cycleDay}` : "",
    phaseLabel,
    phaseDate: workspaceContext.activePhase?.startDate ? formatDate(workspaceContext.activePhase.startDate) : ""
  });

  return <section className={`patient-smart-identity-bar patient-banner ${patientTypeSemanticClass(patient.patientType)}`} aria-label="Current patient and clinical context">
    <div className="patient-smart-primary">
      <span className="patient-smart-avatar" aria-hidden="true">{patient.firstName?.[0]}{patient.lastName?.[0]}</span>
      <div>
        <div className="patient-smart-name">
          <strong>{patient.firstName} {patient.lastName}</strong>
          <span className="patient-type-badge">{currentPhase ? currentPhase.phaseType.replaceAll("_", " ") : patientTypeLabel(patient.patientType)}</span>
        </div>
        <p><span>{ageLabel(patient.dateOfBirth)}</span> · <span>MRN {patient.medicalRecordNumber}</span><br /><span>{patient.phone || "Not recorded"}</span></p>
      </div>
    </div>
    <div className="patient-smart-signals">
      <span className="patient-blood-group"><small>Blood group</small><strong>{bloodGroup}</strong></span>
      <span className={allergies === undefined || allergies.length ? "warning patient-allergy-signal" : "patient-allergy-signal"}><small>Allergies</small><strong>{allergies === undefined ? "Not recorded" : allergies.length ? `${allergies.length} recorded` : "None recorded"}</strong></span>
      {specialtyFields.map((field) => <span key={field.label}><small>{field.label}</small><strong>{field.value || "Not recorded"}</strong></span>)}
    </div>
  </section>;
}

function contextFields(mode: PatientWorkspaceContext["mode"], values: { gravidaPara: string; ga: string; edd: string; lmp: string; cycleDay: string; phaseLabel: string; phaseDate: string; datingMethod: string; datingStatus: string; trimester: string }) {
  if (mode === "pregnancy") return [{ label: "LMP", value: values.lmp }, { label: "EDD", value: values.edd }, { label: "GA", value: values.ga }, { label: "Trimester", value: values.trimester }, { label: "Dating method", value: values.datingMethod }, { label: "Dating status", value: values.datingStatus }];
  if (mode === "infertility") return [{ label: "Cycle day", value: values.cycleDay }, { label: "LMP", value: values.lmp }, { label: "Fertility context", value: values.phaseLabel }];
  if (mode === "gynecology") return [{ label: "Gravida / Para", value: values.gravidaPara }, { label: "LMP", value: values.lmp }, { label: "Cycle context", value: values.cycleDay }];
  if (mode === "postpartum") return [{ label: "Delivery date", value: values.phaseDate }, { label: "Postpartum interval", value: values.phaseLabel }, { label: "Feeding context", value: "" }];
  if (mode === "menopause") return [{ label: "Menopause phase", value: values.phaseLabel }, { label: "LMP", value: values.lmp }, { label: "Review context", value: "" }];
  if (mode === "postoperative") return [{ label: "Procedure", value: values.phaseLabel }, { label: "Procedure date", value: values.phaseDate }, { label: "Postoperative interval", value: "" }];
  return [{ label: "Clinical phase", value: values.phaseLabel }];
}

function pregnancyTrimester(ga: string) {
  const weeks = Number(ga.match(/^(\d+)/)?.[1]);
  if (!Number.isFinite(weeks)) return "";
  return weeks < 14 ? "First" : weeks < 28 ? "Second" : "Third";
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

function normalizedBloodGroup(value: string) {
  const allowed = new Set(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
  const normalized = value.trim().toUpperCase().replaceAll("−", "-").replaceAll("–", "-");
  return allowed.has(normalized) ? normalized : "Not recorded";
}
