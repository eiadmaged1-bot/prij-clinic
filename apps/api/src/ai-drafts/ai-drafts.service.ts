import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AiDraftStatus, AiDraftType, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceEncounter, assertCanReferencePatient } from "../auth/reference-scope";
import { branchScope, doctorScope, patientBranchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAiDraftDto, GenerateAssistantDraftDto, ReviewAiDraftDto } from "./dto";

@Injectable()
export class AiDraftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async create(dto: CreateAiDraftDto, user: AuthUser) {
    if (!dto.patientId) {
      throw new BadRequestException("Patient is required for AI draft placeholders.");
    }

    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, {
      patientId: dto.patientId,
      requireDoctorScope: true
    });

    const draft = await this.prisma.aiDraft.create({
      data: {
        branchId: patient?.branchId ?? user.branchId,
        patientId: dto.patientId ?? null,
        encounterId: dto.encounterId ?? null,
        draftType: dto.draftType,
        status: "pending_doctor_review",
        inputSourceSummary: clean(dto.inputSourceSummary),
        generatedText: placeholderText(dto.draftType),
        requestedByUserId: user.id
      },
      include: aiDraftIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "ai_draft.placeholder_created",
      resourceType: "ai_draft",
      resourceId: draft.id,
      branchId: draft.branchId,
      severity: "high",
      metadataJson: {
        draftType: draft.draftType,
        status: draft.status,
        modelProvider: draft.modelProvider,
        externalAiAccess: false
      }
    });

    return draft;
  }

  async list(user: AuthUser) {
    const drafts = await this.prisma.aiDraft.findMany({
      where: branchScope(user),
      orderBy: { createdAt: "desc" },
      take: 100,
      include: aiDraftIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "ai_draft.list_read",
      resourceType: "ai_draft",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { count: drafts.length, externalAiAccess: false }
    });

    return drafts;
  }

  async get(id: string, user: AuthUser) {
    const draft = await this.prisma.aiDraft.findFirst({ where: { id, ...branchScope(user) }, include: aiDraftIncludes });
    if (!draft) {
      throw new NotFoundException("AI draft placeholder not found.");
    }

    await this.audit.record({
      actorUserId: user.id,
      action: "ai_draft.read",
      resourceType: "ai_draft",
      resourceId: draft.id,
      branchId: draft.branchId,
      severity: "medium",
      metadataJson: { draftType: draft.draftType, status: draft.status, externalAiAccess: false }
    });

    return draft;
  }

  async review(id: string, dto: ReviewAiDraftDto, user: AuthUser) {
    const existing = await this.get(id, user);
    const allowed: AiDraftStatus[] = ["approved", "rejected", "doctor_edited", "expired", "voided"];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException("Review status must be approved, rejected, doctor_edited, expired, or voided.");
    }
    if (dto.status === "rejected" && !dto.reviewNote?.trim()) {
      throw new BadRequestException("A rejection reason is required.");
    }

    const draft = await this.prisma.aiDraft.update({
      where: { id },
      data: {
        status: dto.status,
        reviewNote: clean(dto.reviewNote),
        reviewedAt: new Date(),
        reviewedByUserId: user.id
      },
      include: aiDraftIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: `ai_draft.${dto.status}`,
      resourceType: "ai_draft",
      resourceId: draft.id,
      branchId: draft.branchId,
      severity: "high",
      metadataJson: {
        fromStatus: existing.status,
        toStatus: draft.status,
        insertedIntoClinicalRecord: false
      }
    });

    return draft;
  }

  safetyStatus() {
    return {
      externalAiEnabled: false,
      modelProvider: "disabled_mock",
      modelName: "no_external_ai",
      clinicalOutputMode: "draft_only",
      doctorReviewRequired: true,
      autonomousDiagnosis: false,
      autonomousPrescribing: false,
      autonomousDosing: false,
      patientDataExternalSharing: false,
      promptInjectionGuard: "External or user-provided content is treated as untrusted text, never as instructions."
    };
  }

  async patientAssistant(patientId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    const context = await this.loadPatientContext(patientId, user);
    const checklist = missingFieldChecklist(context);

    await this.audit.record({
      actorUserId: user.id,
      action: "ai_assistant.patient_context_read",
      resourceType: "patient",
      resourceId: patientId,
      branchId: context.patient.branchId,
      severity: "medium",
      metadataJson: { externalAiAccess: false, checklistCount: checklist.length }
    });

    return {
      patientId,
      safetyStatus: this.safetyStatus(),
      availableDrafts: [
        { kind: "patient_history_summary", label: "Patient history summary draft" },
        { kind: "visit_note_summary", label: "Visit note summary draft" },
        { kind: "follow_up_reminder", label: "Follow-up reminder draft" }
      ],
      missingFieldChecklist: checklist,
      draftLabel: "Draft - doctor review required"
    };
  }

  async generateAssistantDraft(patientId: string, dto: GenerateAssistantDraftDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, {
      patientId,
      requireDoctorScope: true
    });

    const draftKind = normalizeDraftKind(dto.draftKind);
    const context = await this.loadPatientContext(patientId, user, dto.encounterId);
    const detectedPromptInjection = hasPromptInjectionLikeText(context);
    const generatedText = generateDraftText(draftKind, context);
    const draftType = draftTypeForKind(draftKind);
    const inputSourceSummary = sourceSummaryForKind(draftKind, context);

    const draft = await this.prisma.aiDraft.create({
      data: {
        branchId: patient.branchId ?? user.branchId,
        patientId,
        encounterId: dto.encounterId ?? context.latestEncounter?.id ?? null,
        draftType,
        status: "pending_doctor_review",
        inputSourceSummary,
        generatedText,
        promptVersion: `safe_${draftKind}_v1`,
        requestedByUserId: user.id
      },
      include: aiDraftIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "ai_draft.safe_assistant_generated",
      resourceType: "ai_draft",
      resourceId: draft.id,
      branchId: draft.branchId,
      severity: "high",
      metadataJson: {
        patientId,
        encounterId: draft.encounterId,
        draftKind,
        draftType,
        safetyStatus: "draft_only_doctor_review_required",
        modelProvider: draft.modelProvider,
        externalAiAccess: false,
        insertedIntoClinicalRecord: false,
        promptInjectionWarning: detectedPromptInjection
      }
    });

    if (detectedPromptInjection) {
      await this.audit.record({
        actorUserId: user.id,
        action: "ai_draft.prompt_injection_warning",
        resourceType: "ai_draft",
        resourceId: draft.id,
        branchId: draft.branchId,
        severity: "high",
        metadataJson: {
          patientId,
          externalAiAccess: false,
          instructionIgnored: true
        }
      });
    }

    return draft;
  }

  async searchPatientFile(patientId: string, query: string, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const context = await this.loadPatientContext(patientId, user);
    const term = query.trim().toLowerCase();
    const results = term ? patientSearchResults(context, term) : [];

    await this.audit.record({
      actorUserId: user.id,
      action: "ai_assistant.patient_file_search",
      resourceType: "patient",
      resourceId: patientId,
      branchId: patient.branchId,
      severity: "medium",
      metadataJson: {
        resultCount: results.length,
        patientScoped: true,
        externalAiAccess: false,
        queryLength: query.trim().length
      }
    });

    return {
      patientId,
      patientScoped: true,
      externalAiAccess: false,
      results
    };
  }

  private async loadPatientContext(patientId: string, user: AuthUser, encounterId?: string) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const [
      historySheets,
      operationHistory,
      medicationHistory,
      investigationHistory,
      encounters,
      prescriptions,
      investigationOrders,
      investigationResults,
      reports,
      gynecologyVisits,
      pregnancies,
      patientDocuments,
      consentRecords,
      followUps
    ] = await Promise.all([
      this.prisma.patientHistorySheet.findMany({ where: { patientId }, orderBy: { updatedAt: "desc" }, take: 5 }),
      this.prisma.patientOperationHistoryItem.findMany({ where: { patientId }, orderBy: { createdAt: "desc" }, take: 20 }),
      this.prisma.patientMedicationHistoryItem.findMany({ where: { patientId }, orderBy: { createdAt: "desc" }, take: 20 }),
      this.prisma.patientInvestigationHistoryItem.findMany({ where: { patientId }, orderBy: { createdAt: "desc" }, take: 20 }),
      this.prisma.encounter.findMany({ where: { patientId, ...doctorScope(user), ...patientBranchScope(user) }, orderBy: { createdAt: "desc" }, take: 10 }),
      this.prisma.prescription.findMany({ where: { patientId, ...doctorScope(user), ...patientBranchScope(user) }, include: { items: true }, orderBy: { createdAt: "desc" }, take: 10 }),
      this.prisma.investigationOrder.findMany({ where: { patientId, ...doctorScope(user), ...patientBranchScope(user) }, include: { items: true }, orderBy: { createdAt: "desc" }, take: 10 }),
      this.prisma.investigationResult.findMany({ where: { patientId, ...branchScope(user) }, orderBy: { createdAt: "desc" }, take: 20 }),
      this.prisma.report.findMany({ where: { patientId, ...branchScope(user) }, orderBy: { createdAt: "desc" }, take: 20 }),
      this.prisma.gynecologyVisit.findMany({ where: { patientId, ...branchScope(user) }, orderBy: { visitDate: "desc" }, take: 10 }),
      this.prisma.pregnancy.findMany({ where: { patientId, ...branchScope(user) }, include: { fetuses: true }, orderBy: { createdAt: "desc" }, take: 10 }),
      this.prisma.patientDocument.findMany({ where: { patientId, ...branchScope(user) }, orderBy: { createdAt: "desc" }, take: 20 }),
      this.prisma.consentRecord.findMany({ where: { patientId }, orderBy: { capturedAt: "desc" }, take: 20 }),
      this.prisma.patientTask.findMany({ where: { patientId, taskType: "schedule_follow_up", ...branchScope(user) }, orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }], take: 10 })
    ]);
    const latestEncounter = encounterId
      ? encounters.find((encounter) => encounter.id === encounterId) ?? null
      : encounters[0] ?? null;
    return {
      patient,
      historySheets,
      operationHistory,
      medicationHistory,
      investigationHistory,
      encounters,
      latestEncounter,
      prescriptions,
      investigationOrders,
      investigationResults,
      reports,
      gynecologyVisits,
      pregnancies,
      patientDocuments,
      consentRecords,
      followUps
    };
  }
}

const aiDraftIncludes = {
  patient: true,
  encounter: true
} satisfies Prisma.AiDraftInclude;

function clean(value?: string) {
  return value?.trim() || null;
}

function placeholderText(draftType: string) {
  return [
    `AI draft placeholder for ${draftType}.`,
    "External AI access is disabled in this MVP.",
    "This is not a diagnosis, prescription, signed record, final interpretation, or patient instruction.",
    "Any future AI output must remain draft-only until reviewed and approved by an authorized doctor."
  ].join(" ");
}

type AssistantContext = Awaited<ReturnType<AiDraftsService["loadPatientContext"]>>;
type AssistantDraftKind = "patient_history_summary" | "visit_note_summary" | "follow_up_reminder";

function normalizeDraftKind(value: string): AssistantDraftKind {
  if (value === "patient_history_summary" || value === "visit_note_summary" || value === "follow_up_reminder") return value;
  throw new BadRequestException("AI assistant draft type is not available.");
}

function draftTypeForKind(kind: AssistantDraftKind): AiDraftType {
  if (kind === "patient_history_summary") return "report_summary";
  if (kind === "visit_note_summary") return "encounter_summary";
  return "follow_up_message";
}

function sourceSummaryForKind(kind: AssistantDraftKind, context: AssistantContext) {
  const counts = [
    `${context.historySheets.length} history sheet(s)`,
    `${context.encounters.length} visit note(s)`,
    `${context.prescriptions.length} prescription record(s)`,
    `${context.investigationOrders.length} investigation order(s)`,
    `${context.reports.length} report metadata record(s)`
  ].join(", ");
  return `${kind.replaceAll("_", " ")} generated locally from existing patient-scoped records only: ${counts}. External AI access disabled.`;
}

function generateDraftText(kind: AssistantDraftKind, context: AssistantContext) {
  if (kind === "patient_history_summary") return patientHistorySummaryDraft(context);
  if (kind === "visit_note_summary") return visitNoteSummaryDraft(context);
  return followUpReminderDraft(context);
}

function patientHistorySummaryDraft(context: AssistantContext) {
  const patient = context.patient;
  const latestHistory = context.historySheets[0];
  const latestPregnancy = context.pregnancies[0];
  const latestGyn = context.gynecologyVisits[0];
  return [
    "Draft - doctor review required.",
    "Local patient history summary from recorded fields only.",
    `Patient context: ${patient.patientType ?? "Unknown patient type"}; sex ${patient.sex ?? "unknown"}; date of birth ${dateOnly(patient.dateOfBirth) ?? "unknown"}.`,
    `Chief complaint in latest history sheet: ${safeText(latestHistory?.chiefComplaint) ?? "unknown"}.`,
    `History notes recorded: ${safeText(latestHistory?.historyOfPresentIllness) ?? "unknown"}.`,
    `Prior operations recorded: ${listOrUnknown(context.operationHistory.map((item) => item.operationNameSnapshot ?? item.notes))}.`,
    `Prior medications recorded: ${listOrUnknown(context.medicationHistory.map((item) => item.genericNameSnapshot ?? item.notes))}.`,
    `Investigation history recorded: ${listOrUnknown(context.investigationHistory.map((item) => item.investigationNameSnapshot ?? item.notes))}.`,
    `Gynecology context: ${safeText(latestGyn?.reasonForVisit ?? latestGyn?.templateType) ?? "unknown"}.`,
    `Pregnancy context: ${latestPregnancy ? `${latestPregnancy.status}; ${latestPregnancy.fetuses.length || 1} fetus record(s)` : "unknown"}.`,
    "No diagnosis, treatment plan, medication choice, dose, or investigation suggestion is generated by this draft."
  ].join("\n");
}

function visitNoteSummaryDraft(context: AssistantContext) {
  const encounter = context.latestEncounter;
  const prescriptions = context.prescriptions.filter((item) => !encounter || item.encounterId === encounter.id);
  const orders = context.investigationOrders.filter((item) => !encounter || item.encounterId === encounter.id);
  return [
    "Draft - doctor review required.",
    "Local visit note summary from doctor-entered fields only.",
    `Chief complaint: ${safeText(encounter?.chiefComplaint) ?? "unknown"}.`,
    `History notes: ${safeText(encounter?.historyText) ?? "unknown"}.`,
    `Examination notes: ${safeText(encounter?.examText) ?? "unknown"}.`,
    `Doctor-entered assessment text: ${safeText(encounter?.assessmentText) ?? "unknown"}.`,
    `Doctor-entered plan text: ${safeText(encounter?.planText) ?? "unknown"}.`,
    `Investigations already requested: ${listOrUnknown(orders.flatMap((order) => order.items.map((item) => item.testName)))}.`,
    `Prescription items already manually added: ${listOrUnknown(prescriptions.flatMap((prescription) => prescription.items.map((item) => item.genericName ?? item.medicationName)))}.`,
    `Follow-up already recorded: ${listOrUnknown(context.followUps.map((task) => task.dueAt ? `due ${dateOnly(task.dueAt)}` : task.title))}.`,
    "No new diagnosis, medication, dose, treatment ranking, or final clinical decision is generated by this draft."
  ].join("\n");
}

function followUpReminderDraft(context: AssistantContext) {
  const nextFollowUp = context.followUps.find((task) => task.dueAt) ?? context.followUps[0];
  return [
    "Draft - doctor/staff review required before use.",
    "Follow-up reminder draft, not sent automatically.",
    `Hello. This is a clinic reminder for your follow-up${nextFollowUp?.dueAt ? ` on ${dateOnly(nextFollowUp.dueAt)}` : ""}. Please contact the clinic if you need to reschedule.`,
    "This draft intentionally avoids sensitive clinical details. No WhatsApp, SMS, email, or patient communication is sent by the AI assistant."
  ].join("\n");
}

function missingFieldChecklist(context: AssistantContext) {
  const encounter = context.latestEncounter;
  const pregnancyRelated = context.patient.patientType === "OB" || context.pregnancies.some((pregnancy) => pregnancy.status === "active");
  const pendingResults = context.investigationResults.filter((result) => result.reviewStatus !== "reviewed");
  return [
    checklistItem("chief_complaint", "Chief complaint", Boolean(encounter?.chiefComplaint)),
    checklistItem("examination_note", "Examination note", Boolean(encounter?.examText)),
    checklistItem("follow_up_date", "Follow-up date", context.followUps.some((task) => Boolean(task.dueAt))),
    checklistItem("pregnancy_episode_link", "Pregnancy episode link", !pregnancyRelated || context.pregnancies.length > 0),
    checklistItem("consent_status", "Consent status", context.consentRecords.length > 0),
    checklistItem("result_review_status", "Investigation result review status", pendingResults.length === 0)
  ];
}

function checklistItem(key: string, label: string, complete: boolean) {
  return {
    key,
    label,
    status: complete ? "recorded" : "missing",
    note: complete ? "Recorded in this patient file." : "Missing or not recorded. Checklist only; no clinical recommendation."
  };
}

function patientSearchResults(context: AssistantContext, term: string) {
  const rows: Array<{ section: string; label: string; status?: string | null; summary: string; date?: string | null }> = [];
  const push = (section: string, label: string, status: string | null | undefined, summary: string, date?: Date | null) => {
    const haystack = `${section} ${label} ${status ?? ""} ${summary}`.toLowerCase();
    if (haystack.includes(term)) rows.push({ section, label, status, summary, date: dateOnly(date) });
  };

  for (const encounter of context.encounters) push("Visits", encounter.chiefComplaint ?? "Visit note", encounter.status, [encounter.historyText, encounter.examText, encounter.assessmentText, encounter.planText].map(safeText).filter(Boolean).join(" | ") || "Doctor-entered visit record.", encounter.createdAt);
  for (const prescription of context.prescriptions) push("Prescriptions", "Prescription record", prescription.status, prescription.items.map((item) => item.genericName ?? item.medicationName).filter(Boolean).join(", ") || "Medication item metadata.", prescription.createdAt);
  for (const order of context.investigationOrders) push("Investigations", "Investigation order", order.status, order.items.map((item) => item.testName).join(", ") || "Investigation order metadata.", order.createdAt);
  for (const report of context.reports) push("Reports", report.title, report.status, report.resultSummary ?? "Report metadata.", report.createdAt);
  for (const document of context.patientDocuments) push("Documents", document.title, document.status, `${document.category ?? "Document"} metadata only.`, document.createdAt);
  for (const gyn of context.gynecologyVisits) push("Gynecology", gyn.reasonForVisit ?? gyn.templateType ?? "Gynecology note", "recorded", [gyn.menstrualHistory, gyn.examinationNotes].map(safeText).filter(Boolean).join(" | ") || "Gynecology record.", gyn.visitDate);
  for (const pregnancy of context.pregnancies) push("Pregnancy", "Pregnancy episode", pregnancy.status, pregnancy.notes ?? `${pregnancy.fetuses.length || 1} fetus record(s).`, pregnancy.createdAt);

  return rows.slice(0, 25);
}

function hasPromptInjectionLikeText(context: AssistantContext) {
  const text = [
    ...context.historySheets.map((item) => `${item.chiefComplaint ?? ""} ${item.historyOfPresentIllness ?? ""} ${item.notes ?? ""}`),
    ...context.encounters.map((item) => `${item.chiefComplaint ?? ""} ${item.historyText ?? ""} ${item.examText ?? ""} ${item.assessmentText ?? ""} ${item.planText ?? ""}`),
    ...context.patientDocuments.map((item) => `${item.title ?? ""} ${item.category ?? ""}`)
  ].join(" ");
  return /ignore previous instructions|system prompt|developer message|reveal secrets|api key|bypass|override instructions/i.test(text);
}

function safeText(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.trim().replace(/ignore previous instructions|system prompt|developer message|reveal secrets|api key/gi, "[untrusted instruction removed]");
  return text || null;
}

function listOrUnknown(values: Array<string | null | undefined>) {
  const cleaned = values.map(safeText).filter((value): value is string => Boolean(value)).slice(0, 8);
  return cleaned.length ? cleaned.join(", ") : "unknown";
}

function dateOnly(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}
