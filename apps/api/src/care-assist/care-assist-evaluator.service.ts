import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EvaluateCareAssistDto } from "./dto/evaluate-care-assist.dto";

type DraftFinding = {
  ruleCode: string;
  title: string;
  message: string;
  category: string;
  severity: string;
  missingFields: string[];
  suggestedAction: Record<string, unknown>;
  source?: Record<string, unknown>;
  contextKey: string;
};

@Injectable()
export class CareAssistEvaluatorService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(dto: EvaluateCareAssistDto) {
    const [patient, encounter, historySheet, prescription, investigationOrder] = await Promise.all([
      this.prisma.patient.findUnique({
        where: { id: dto.patientId },
        include: {
          medicationHistoryItems: true,
          investigationHistoryItems: true,
          patientMedications: { where: { status: "active" } },
          patientAllergies: { where: { status: "active" } },
          pregnancies: { where: { status: "active" }, take: 1, orderBy: { createdAt: "desc" } }
        }
      }),
      dto.encounterId ? this.prisma.encounter.findUnique({ where: { id: dto.encounterId } }) : null,
      dto.historySheetId
        ? this.prisma.patientHistorySheet.findUnique({
            where: { id: dto.historySheetId },
            include: { medicationHistoryItems: true, investigationHistoryItems: true, operationHistoryItems: true }
          })
        : this.prisma.patientHistorySheet.findFirst({
            where: { patientId: dto.patientId },
            include: { medicationHistoryItems: true, investigationHistoryItems: true, operationHistoryItems: true },
            orderBy: { createdAt: "desc" }
          }),
      dto.prescriptionId
        ? this.prisma.prescription.findUnique({
            where: { id: dto.prescriptionId },
            include: { items: { include: { medicationGeneric: { include: { safetyProfile: true } } } } }
          })
        : null,
      dto.investigationOrderId
        ? this.prisma.investigationOrder.findUnique({
            where: { id: dto.investigationOrderId },
            include: { items: true, results: true }
          })
        : null
    ]);

    const findings: DraftFinding[] = [];
    if (!patient) return { findings, dataUsed: { patientFound: false } };

    const pregnancy = patient.pregnancies[0] ?? null;
    if (historySheet) {
      missing(historySheet.chiefComplaint, findings, "MISSING_CHIEF_COMPLAINT", "Missing chief complaint", "chiefComplaint");
      missing(historySheet.historyOfPresentIllness, findings, "MISSING_HPI", "Missing HPI", "historyOfPresentIllness");
      missingJson(historySheet.menstrualHistory, findings, "MISSING_MENSTRUAL_HISTORY", "Missing menstrual history", "menstrualHistory");
      missingJson(historySheet.obstetricHistory, findings, "MISSING_OB_HISTORY", "Missing OB history", "obstetricHistory");
      missingJsonKey(historySheet.obstetricHistory, ["gravida", "para", "abortions", "living"], findings, "MISSING_GRAVIDA_PARA_FIELDS", "Missing gravida/para fields");
      missingJsonKey(historySheet.menstrualHistory, ["lmp", "lastMenstrualPeriod"], findings, "MISSING_LMP_OBGYN_HISTORY", "Missing LMP in OB/GYN history");
      missingJsonKey(historySheet.obstetricHistory, ["previousCsCount", "previousCesareanCount"], findings, "MISSING_PREVIOUS_CS_COUNT", "Missing previous CS count");
      missingJson(historySheet.contraceptionHistory, findings, "MISSING_CONTRACEPTION_HISTORY", "Missing contraception history", "contraceptionHistory");
      missing(historySheet.operationHistoryItems.length, findings, "MISSING_PAST_SURGICAL_HISTORY", "Missing past surgical history", "pastSurgicalHistory");
      missing(historySheet.medicationHistoryItems.length || patient.patientMedications.length, findings, "MISSING_MEDICATION_HISTORY", "Missing medication history", "medicationHistory");
      missingJson(historySheet.allergyHistory, findings, "MISSING_ALLERGY_HISTORY", "Missing allergy history", "allergyHistory");
      missing(historySheet.investigationHistoryItems.length || patient.investigationHistoryItems.length, findings, "MISSING_PREVIOUS_INVESTIGATIONS", "Missing previous investigations", "previousInvestigations");
    }

    if (prescription) {
      if (prescription.status !== "signed") {
        findings.push(draft("PRESCRIPTION_DRAFT_NOT_DOCTOR_APPROVED", "Prescription draft has not been doctor-approved", "Prescription remains draft. Doctor approval is required.", "CLINICAL_SAFETY_REVIEW", "HIGH", ["doctorApproval"], "prescription-status"));
      }
      if (!pregnancy) {
        findings.push(draft("MISSING_PREGNANCY_STATUS_BEFORE_PRESCRIPTION", "Missing pregnancy status before prescription safety review", "Pregnancy status is not visible for this prescription review. Doctor review required.", "PREGNANCY_SAFETY", "HIGH", ["pregnancyStatus"], "prescription-pregnancy-status"));
      }
      if (!hasAny(historySheet?.obstetricHistory, ["lactationStatus", "breastfeeding", "lactating"])) {
        findings.push(draft("MISSING_LACTATION_STATUS_BEFORE_PRESCRIPTION", "Missing lactation status before prescription safety review", "Lactation status is not visible for this prescription review. Doctor review required.", "LACTATION_SAFETY", "HIGH", ["lactationStatus"], "prescription-lactation-status"));
      }
      for (const item of prescription.items) {
        const profile = item.medicationGeneric?.safetyProfile;
        const label = item.genericName ?? item.medicationName;
        if (!profile || profile.reviewStatus !== "reviewed" || profile.legacyPregnancyCategory === "REVIEW_REQUIRED" || profile.lactationRiskLevel === "REVIEW_REQUIRED") {
          findings.push(draft("MEDICATION_PROFILE_REVIEW_REQUIRED", "Medication safety profile requires review", `${label} has pregnancy/lactation profile data that requires doctor review.`, "MEDICATION_SAFETY", "HIGH", ["medicationSafetyProfile"], `profile-review-${item.id}`));
        }
        if (profile?.legacyPregnancyCategory === "D" || profile?.legacyPregnancyCategory === "X") {
          findings.push(draft("MEDICATION_LEGACY_DX_CRITICAL_REVIEW", "Legacy pregnancy category D/X review flag", `${label} has a legacy pregnancy category ${profile.legacyPregnancyCategory} flag. Critical doctor review required.`, "PREGNANCY_SAFETY", "CRITICAL_REVIEW", ["legacyPregnancyCategory"], `legacy-${item.id}`));
        }
        if (profile?.lactationRiskLevel === "AVOID") {
          findings.push(draft("MEDICATION_LACTATION_AVOID_CRITICAL_REVIEW", "Lactation avoid review flag", `${label} has a lactation avoid flag. Critical doctor review required.`, "LACTATION_SAFETY", "CRITICAL_REVIEW", ["lactationRiskLevel"], `lactation-${item.id}`));
        }
        if (profile?.legacyPregnancyCategory === "UNKNOWN" || profile?.lactationRiskLevel === "UNKNOWN") {
          findings.push(draft("MEDICATION_PROFILE_UNKNOWN_REVIEW_REQUIRED", "Medication safety profile unknown", `${label} has unknown pregnancy/lactation profile data. Doctor review required.`, "MEDICATION_SAFETY", "MODERATE", ["medicationSafetyProfile"], `profile-unknown-${item.id}`));
        }
      }
    }

    if (investigationOrder) {
      if (!investigationOrder.results.length) {
        findings.push(draft("MISSING_INVESTIGATION_RESULT", "Missing investigation result for ordered investigation", "Investigation order has no linked result yet. Follow-up review may be required.", "INVESTIGATION_FOLLOW_UP", "MODERATE", ["investigationResult"], "investigation-result"));
      }
      if (!investigationOrder.notes?.trim()) {
        findings.push(draft("INVESTIGATION_ORDER_NO_FOLLOW_UP_NOTE", "Investigation order has no follow-up note", "Investigation order follow-up note is not documented.", "INVESTIGATION_FOLLOW_UP", "LOW", ["followUpNote"], "investigation-follow-up-note"));
      }
    }

    if (encounter && !/follow[- ]?up|review/i.test([encounter.planText, encounter.historyText].filter(Boolean).join(" "))) {
      findings.push(draft("NO_NEXT_FOLLOW_UP_DATE_AFTER_ENCOUNTER", "No next follow-up date after encounter", "No next follow-up date is documented after the encounter.", "FOLLOW_UP", "LOW", ["nextFollowUpDate"], "encounter-follow-up"));
    }

    return {
      findings,
      dataUsed: {
        patientId: dto.patientId,
        encounterId: dto.encounterId ?? null,
        historySheetId: historySheet?.id ?? null,
        prescriptionId: dto.prescriptionId ?? null,
        investigationOrderId: dto.investigationOrderId ?? null
      }
    };
  }

  contextHash(dto: EvaluateCareAssistDto, ruleCode: string, contextKey: string) {
    return createHash("sha256")
      .update(JSON.stringify({ ...dto, ruleCode, contextKey }))
      .digest("hex");
  }
}

function draft(ruleCode: string, title: string, message: string, category: string, severity: string, missingFields: string[], contextKey: string): DraftFinding {
  return {
    ruleCode,
    title,
    message,
    category,
    severity,
    missingFields,
    suggestedAction: { label: "Doctor review required", type: "review_required" },
    source: { sourceType: "local_rule", warning: "Reference only. Doctor review required." },
    contextKey
  };
}

function missing(value: unknown, findings: DraftFinding[], ruleCode: string, title: string, field: string) {
  if (!value || (typeof value === "string" && !value.trim())) {
    findings.push(draft(ruleCode, title, `${title}. Doctor review required.`, field.includes("follow") ? "FOLLOW_UP" : "DOCUMENTATION_COMPLETENESS", "LOW", [field], field));
  }
}

function missingJson(value: unknown, findings: DraftFinding[], ruleCode: string, title: string, field: string) {
  if (!value || (typeof value === "object" && Object.keys(value as Record<string, unknown>).length === 0)) {
    findings.push(draft(ruleCode, title, `${title}. Doctor review required.`, "HISTORY_COMPLETENESS", "MODERATE", [field], field));
  }
}

function missingJsonKey(value: unknown, keys: string[], findings: DraftFinding[], ruleCode: string, title: string) {
  if (!hasAny(value, keys)) {
    findings.push(draft(ruleCode, title, `${title}. Doctor review required.`, "HISTORY_COMPLETENESS", "MODERATE", keys, ruleCode.toLowerCase()));
  }
}

function hasAny(value: unknown, keys: string[]) {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return keys.some((key) => Boolean(record[key]));
}
