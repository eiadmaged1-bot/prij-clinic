import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceAppointment, assertCanReferenceEncounter, assertCanReferencePatient } from "../auth/reference-scope";
import { doctorScope, patientBranchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFollowUpDto, StartDoctorVisitDto, UpdateDoctorVisitDto } from "./dto";

@Injectable()
export class DoctorVisitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async start(patientId: string, dto: StartDoctorVisitDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    if (!patient.branchId) throw new BadRequestException("Patient branch is required to start a doctor visit.");
    const appointment = await assertCanReferenceAppointment(this.prisma, dto.appointmentId, user, { patientId, requireDoctorScope: true });
    const existing = await this.prisma.encounter.findFirst({
      where: { patientId, status: "draft", ...doctorScope(user), ...patientBranchScope(user) },
      orderBy: { createdAt: "desc" }
    });

    const encounter = existing ?? await this.prisma.encounter.create({
      data: {
        patientId,
        branchId: patient.branchId,
        appointmentId: appointment?.id ?? null,
        doctorId: user.id
      }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "doctor_visit.started",
      resourceType: "encounter",
      resourceId: encounter.id,
      branchId: patient.branchId,
      severity: "high",
      metadataJson: { patientId, reusedDraft: Boolean(existing), appointmentId: appointment?.id ?? null }
    });

    return this.visitState(patientId, encounter.id, user);
  }

  async current(patientId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    const encounter = await this.prisma.encounter.findFirst({
      where: { patientId, status: "draft", ...doctorScope(user), ...patientBranchScope(user) },
      orderBy: { createdAt: "desc" }
    });
    return encounter ? this.visitState(patientId, encounter.id, user) : { encounter: null, workflow: visitWorkflow() };
  }

  async update(patientId: string, encounterId: string, dto: UpdateDoctorVisitDto, user: AuthUser) {
    const encounter = await assertCanReferenceEncounter(this.prisma, encounterId, user, { patientId, requireDoctorScope: true });
    if (!encounter) throw new NotFoundException("Doctor visit not found.");
    if (encounter.status !== "draft") throw new BadRequestException("Only draft visits can be edited.");
    const updated = await this.prisma.encounter.update({
      where: { id: encounterId },
      data: {
        ...(dto.chiefComplaint !== undefined ? { chiefComplaint: clean(dto.chiefComplaint) } : {}),
        ...(dto.historyText !== undefined ? { historyText: clean(dto.historyText) } : {}),
        ...(dto.examText !== undefined ? { examText: clean(dto.examText) } : {}),
        ...(dto.assessmentText !== undefined ? { assessmentText: clean(dto.assessmentText) } : {}),
        ...(dto.planText !== undefined ? { planText: clean(dto.planText) } : {})
      }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "doctor_visit.encounter_draft_updated",
      resourceType: "encounter",
      resourceId: encounterId,
      branchId: updated.branchId,
      severity: "high",
      metadataJson: { patientId, changedFields: Object.keys(dto) }
    });

    return updated;
  }

  async createFollowUp(patientId: string, encounterId: string, dto: CreateFollowUpDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    await assertCanReferenceEncounter(this.prisma, encounterId, user, { patientId, requireDoctorScope: true });
    const task = await this.prisma.patientTask.create({
      data: {
        patientId,
        branchId: patient.branchId,
        createdByUserId: user.id,
        taskType: "schedule_follow_up",
        title: clean(dto.title) ?? "Follow-up visit",
        description: clean(dto.note),
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null
      }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "doctor_visit.follow_up_created",
      resourceType: "patient_task",
      resourceId: task.id,
      branchId: patient.branchId,
      severity: "medium",
      metadataJson: { patientId, encounterId, dueAt: task.dueAt?.toISOString() ?? null }
    });
    return task;
  }

  async packet(patientId: string, encounterId: string, user: AuthUser) {
    await assertCanReferenceEncounter(this.prisma, encounterId, user, { patientId, requireDoctorScope: true });
    const state = await this.visitState(patientId, encounterId, user);
    await this.audit.record({
      actorUserId: user.id,
      action: "doctor_visit.packet_generated",
      resourceType: "encounter",
      resourceId: encounterId,
      branchId: state.patient.branchId,
      severity: "medium",
      metadataJson: { patientId, prescriptionCount: state.prescriptions.length, investigationOrderCount: state.investigationOrders.length }
    });
    return {
      generatedAt: new Date().toISOString(),
      warning: "Doctor review required. This packet is documentation output, not autonomous diagnosis or prescribing.",
      ...state
    };
  }

  private async visitState(patientId: string, encounterId: string, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const [encounter, historySheet, careAssistFindings, prescriptions, investigationOrders, followUps] = await Promise.all([
      this.prisma.encounter.findFirst({ where: { id: encounterId, patientId, ...doctorScope(user), ...patientBranchScope(user) } }),
      this.prisma.patientHistorySheet.findFirst({ where: { patientId }, orderBy: { updatedAt: "desc" }, include: { medicationHistoryItems: true, investigationHistoryItems: true, operationHistoryItems: true } }),
      this.prisma.careAssistFinding.findMany({ where: { patientId, encounterId }, orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }], take: 50 }),
      this.prisma.prescription.findMany({
        where: { patientId, encounterId, ...doctorScope(user), ...patientBranchScope(user) },
        include: { items: { include: { medicationGeneric: { include: { safetyProfile: true } } } } },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.investigationOrder.findMany({ where: { patientId, encounterId, ...doctorScope(user), ...patientBranchScope(user) }, include: { items: true }, orderBy: { createdAt: "desc" } }),
      this.prisma.patientTask.findMany({ where: { patientId, taskType: "schedule_follow_up" }, orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }], take: 20 })
    ]);
    if (!encounter) throw new NotFoundException("Doctor visit not found.");
    return {
      workflow: visitWorkflow(),
      patient: patientSummary(patient),
      encounter,
      historySheet,
      careAssistFindings,
      prescriptions: prescriptions.map((prescription) => ({
        ...prescription,
        items: prescription.items.map((item) => ({
          id: item.id,
          medicationName: item.genericName ?? item.medicationName,
          genericName: item.genericName ?? item.medicationGeneric?.genericName ?? item.medicationName,
          tradeName: item.tradeName,
          brandName: item.brandName,
          instructions: item.instructions,
          dose: item.dose,
          frequency: item.frequency,
          duration: item.duration,
          safetyProfile: item.medicationGeneric?.safetyProfile ? safetySummary(item.medicationGeneric.safetyProfile) : null
        }))
      })),
      investigationOrders,
      followUps
    };
  }
}

function visitWorkflow() {
  return ["History", "Care Assist", "Encounter", "Prescription", "Investigations", "Follow-up", "Print Packet"];
}

function patientSummary(patient: { id: string; branchId: string | null; medicalRecordNumber: string; firstName: string; lastName: string; dateOfBirth: Date | null; sex: string | null; patientType: string }) {
  return {
    id: patient.id,
    branchId: patient.branchId,
    medicalRecordNumber: patient.medicalRecordNumber,
    name: `${patient.firstName} ${patient.lastName}`.trim(),
    dateOfBirth: patient.dateOfBirth?.toISOString().slice(0, 10) ?? null,
    sex: patient.sex,
    patientType: patient.patientType
  };
}

function safetySummary(profile: {
  legacyPregnancyCategory: string;
  lactationRiskLevel: string;
  sourceName: string;
  reviewStatus: string;
  confidenceLevel: string;
  lastCheckedAt: Date | null;
  sourceLastUpdatedAt: Date | null;
  sourceVersionLabel: string | null;
  sourceRefreshStatus: string | null;
}) {
  return {
    legacyPregnancyCategory: profile.legacyPregnancyCategory,
    lactationRiskLevel: profile.lactationRiskLevel,
    sourceName: profile.sourceName,
    reviewStatus: profile.reviewStatus,
    confidenceLevel: profile.confidenceLevel,
    lastCheckedAt: profile.lastCheckedAt?.toISOString() ?? null,
    sourceLastUpdatedAt: profile.sourceLastUpdatedAt?.toISOString() ?? null,
    sourceVersionLabel: profile.sourceVersionLabel,
    sourceRefreshStatus: profile.sourceRefreshStatus ?? "UNKNOWN",
    warning: profile.reviewStatus === "reviewed" ? "Doctor review required." : "Review required."
  };
}

function clean(value?: string) {
  return value?.trim() || null;
}
