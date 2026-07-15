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
  dataUsed?: Record<string, unknown>;
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
          clinicalTags: { where: { isRemoved: false, status: "active" } },
          investigationResults: { orderBy: { createdAt: "desc" }, take: 50 },
          pregnancies: { where: { status: "active" }, take: 1, orderBy: { createdAt: "desc" }, include: { antenatalVisits: { orderBy: { visitDate: "desc" }, take: 1 }, fetuses: true, obUltrasounds: { orderBy: { performedAt: "desc" }, take: 1 } } }
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

    const tagText = patient.clinicalTags.map((tag) => `${tag.tagCode} ${tag.label}`).join(" ").toLowerCase();
    const resultText = patient.investigationResults.map((result) => result.title.toLowerCase());
    const actionBase = { patientId: patient.id, encounterId: encounter?.id ?? null };
    if (pregnancy && /hypertension|\bhtn\b/.test(tagText)) {
      const missingFields = [
        !pregnancy.antenatalVisits[0]?.bloodPressure && "blood pressure",
        !resultText.some((title) => /protein|urine/.test(title)) && "proteinuria",
        !resultText.some((title) => /platelet/.test(title)) && "platelets",
        !resultText.some((title) => /creatinine|renal|egfr/.test(title)) && "renal function",
        !resultText.some((title) => /liver|alt|ast/.test(title)) && "liver function",
        !pregnancy.fetuses.length && !pregnancy.obUltrasounds.length && "fetal status"
      ].filter((value): value is string => Boolean(value));
      findings.push(contextualDraft("PREGNANCY_HYPERTENSION_CONTEXT", "Pregnancy with hypertension context", "Pregnancy and an active hypertension fact are recorded. Review the related pathway and missing assessment information; no diagnosis is inferred.", "PREGNANCY_SAFETY", "HIGH", missingFields, "pregnancy-hypertension", {
        ...actionBase, factsUsed: ["active pregnancy record", "active hypertension clinical tag"], relatedPathway: "Hypertension in pregnancy / preeclampsia assessment and prevention", relatedMedicines: ["Medication review in Clinical Drug Atlas"], relatedInvestigations: ["Blood pressure", "Urine protein", "Platelet count", "Renal function", "Liver function", "Fetal status"]
      }));
    }

    const infertilityText = JSON.stringify(historySheet?.infertilityHistory ?? {}).toLowerCase();
    if (/pcos|polycystic/.test(tagText) && (patient.patientType === "INFERTILITY" || /fertility|conceiv|pregnan/.test(infertilityText))) {
      findings.push(contextualDraft("PCOS_FERTILITY_GOAL_CONTEXT", "PCOS with fertility goal context", "PCOS and a structured fertility context are recorded. Review the pathway and available linked references; no treatment is selected.", "CLINICAL_SAFETY_REVIEW", "MODERATE", [], "pcos-fertility", {
        ...actionBase, factsUsed: ["active PCOS clinical tag", patient.patientType === "INFERTILITY" ? "patient infertility phase" : "fertility goal in history sheet"], relatedPathway: "PCOS infertility pathway / ovulation-induction protocol", relatedMedicines: ["Metformin profile", "Related ovulation-induction medication profiles"], relatedInvestigations: ["Metabolic investigation set"]
      }));
    }

    const penicillinAllergy = patient.patientAllergies.find((allergy) => /penicillin|amoxicillin/.test(allergy.displayName.toLowerCase()));
    if (penicillinAllergy) {
      const missingFields = [!penicillinAllergy.reactionText?.trim() && "allergy reaction", (!penicillinAllergy.severity || penicillinAllergy.severity === "unknown") && "allergy severity"].filter((value): value is string => Boolean(value));
      findings.push(contextualDraft("PENICILLIN_ALLERGY_CONTEXT", "Penicillin allergy context", "A penicillin-family allergy record is present. Confirm allergy details and review the antibiotic protocol before any medication decision.", "MEDICATION_SAFETY", "HIGH", missingFields, `penicillin-allergy-${penicillinAllergy.id}`, {
        ...actionBase, factsUsed: [`active allergy: ${penicillinAllergy.displayName}`], relatedPathway: "Antibiotic protocol", relatedMedicines: ["Alternative medication review; no alternative selected"], relatedInvestigations: []
      }));
    }

    const renalTag = patient.clinicalTags.find((tag) => /renal impairment|kidney disease|\bckd\b/.test(`${tag.tagCode} ${tag.label}`.toLowerCase()));
    if (renalTag && patient.patientMedications.length) {
      const renalResult = patient.investigationResults.find((result) => /creatinine|renal|egfr/.test(result.title.toLowerCase()));
      const observedAt = renalResult?.resultDate ?? renalResult?.createdAt;
      const stale = !observedAt || Date.now() - observedAt.getTime() > 90 * 24 * 60 * 60 * 1000;
      findings.push(contextualDraft("RENAL_IMPAIRMENT_ACTIVE_MEDICINE_CONTEXT", "Renal impairment with active medication context", "Renal impairment and active medication records are present. Review renal guidance and current renal results; no medication change is proposed.", "MEDICATION_SAFETY", "HIGH", stale ? [renalResult ? "current renal result (latest is stale)" : "current renal result"] : [], "renal-active-medicine", {
        ...actionBase, factsUsed: ["active renal impairment clinical tag", `${patient.patientMedications.length} active medication record(s)`], relatedPathway: "Renal medication guidance", relatedMedicines: patient.patientMedications.map((medication) => medication.genericName || medication.displayName), relatedInvestigations: ["Current renal function"], calculatorLink: "/medications"
      }));
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

function contextualDraft(ruleCode: string, title: string, message: string, category: string, severity: string, missingFields: string[], contextKey: string, context: Record<string, unknown>): DraftFinding {
  const patientId = String(context.patientId);
  const encounterId = typeof context.encounterId === "string" ? context.encounterId : null;
  const pathway = String(context.relatedPathway ?? "");
  const medicine = Array.isArray(context.relatedMedicines) ? String(context.relatedMedicines[0] ?? "") : "";
  return {
    ruleCode, title, message, category, severity, missingFields, contextKey,
    dataUsed: { factsUsed: context.factsUsed ?? [], patientId, encounterId },
    suggestedAction: {
      whyItAppeared: message,
      factsUsed: context.factsUsed ?? [],
      missingInformation: missingFields,
      relatedPathway: pathway,
      relatedMedicines: context.relatedMedicines ?? [],
      relatedInvestigations: context.relatedInvestigations ?? [],
      actions: [
        { label: "Review", type: "review" },
        { label: "Open pathway", type: "link", href: `/guidelines/search?q=${encodeURIComponent(pathway)}` },
        { label: "Add selected investigations", type: "link", href: `/investigations?patientId=${patientId}&contextRule=${ruleCode}` },
        { label: "Open medication profile", type: "link", href: `/medications?q=${encodeURIComponent(medicine)}` },
        ...(encounterId ? [{ label: "Add medication to prescription draft", type: "link", href: `/prescriptions?patientId=${patientId}&encounterId=${encounterId}&medication=${encodeURIComponent(medicine)}` }] : []),
        { label: "Create follow-up", type: "link", href: `/appointments?patientId=${patientId}` }
      ]
    },
    source: { sourceType: "deterministic_structured_rule", version: "v1.4.7", warning: "Assistive draft only. Doctor confirmation required." }
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
