import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceAppointment, assertCanReferenceEncounter, assertCanReferencePatient } from "../auth/reference-scope";
import { doctorScope, patientBranchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { mergeComplaintLifecycle } from "../complaints/complaint-lifecycle";
import { ClinicTimeService } from "../clinic-time/clinic-time.service";
import { IdempotencyService } from "../idempotency/idempotency.service";
import { CreateFollowUpDto, StartDoctorVisitDto, UpdateDoctorVisitDto } from "./dto";

@Injectable()
export class DoctorVisitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly idempotency: IdempotencyService,
    private readonly clinicTime: ClinicTimeService
  ) {}

  async start(patientId: string, dto: StartDoctorVisitDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    if (!patient.branchId) throw new BadRequestException("Patient branch is required to start a doctor visit.");
    const branchId = patient.branchId;
    const appointment = await assertCanReferenceAppointment(this.prisma, dto.appointmentId, user, { patientId, requireDoctorScope: true });
    const doctorProfile = await this.prisma.user.findUnique({ where: { id: user.id }, select: { id: true, displayName: true, doctorColor: true, doctorShortLabel: true } });
    if (!doctorProfile) throw new BadRequestException("Doctor profile is required to start a visit.");
    const doctorColor = normalizeDoctorColor(doctorProfile.doctorColor, user.id);
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const ticket = dto.queueTicketId ? await tx.queueTicket.findFirst({
        where: { id: dto.queueTicketId, patientId, branchId, status: { in: ["waiting", "called", "in_room"] } },
}) : null;
      if (dto.queueTicketId && !ticket) throw new NotFoundException("Active queue ticket not found for this patient.");
      const linkedEncounter = ticket ? await tx.encounter.findUnique({ where: { queueTicketId: ticket.id } }) : null;
      if (linkedEncounter && linkedEncounter.status !== "draft") throw new ConflictException("The linked visit is no longer active.");
      if (linkedEncounter && linkedEncounter.doctorId !== user.id) throw new ConflictException("This visit is active with another doctor.");

      const occupied = ticket ? await tx.queueTicket.findFirst({
        where: { branchId, queueDate: ticket.queueDate, status: "in_room", id: { not: ticket.id } },
        select: { id: true }
      }) : null;
      if (occupied) throw new ConflictException({ code: "DOCTOR_ROOM_OCCUPIED", message: "Resume or complete the current visit before starting another patient." });

      let encounter = linkedEncounter ?? await tx.encounter.findFirst({
        where: { patientId, status: "draft", ...doctorScope(user), ...patientBranchScope(user) },
        orderBy: { createdAt: "desc" }
      });
      if (ticket && encounter?.queueTicketId && encounter.queueTicketId !== ticket.id) throw new ConflictException("This draft visit belongs to another queue ticket.");

      encounter = encounter ? await tx.encounter.update({
        where: { id: encounter.id },
        data: {
          queueTicketId: ticket?.id,
          visitType: ticket?.visitType ?? encounter.visitType,
          startedByUserId: encounter.startedByUserId ?? user.id,
          doctorDisplayNameSnapshot: encounter.doctorDisplayNameSnapshot ?? doctorProfile.displayName,
          doctorColorSnapshot: encounter.doctorColorSnapshot ?? doctorColor,
          startedAt: encounter.startedAt ?? now
        }
      }) : await tx.encounter.create({
        data: { patientId, branchId, appointmentId: appointment?.id ?? ticket?.appointmentId ?? undefined, queueTicketId: ticket?.id, visitType: ticket?.visitType ?? null, doctorId: user.id, startedByUserId: user.id, doctorDisplayNameSnapshot: doctorProfile.displayName, doctorColorSnapshot: doctorColor, startedAt: now }
      });

      if (ticket && ticket.status !== "in_room") {
        const claimed = await tx.queueTicket.updateMany({ where: { id: ticket.id, status: { in: ["waiting", "called"] } }, data: { status: "in_room", calledAt: ticket.calledAt ?? now } });
        if (claimed.count !== 1) throw new ConflictException({ code: "QUEUE_SELECTION_CONFLICT", message: "The waiting line changed. Refresh and try again." });
      }
      return { encounter, ticket, reusedDraft: Boolean(linkedEncounter || encounter.createdAt < now) };
    });

    if (!doctorProfile.doctorColor) await this.prisma.user.update({ where: { id: user.id }, data: { doctorColor } });
    if (result.ticket) await this.audit.record({ actorUserId: user.id, action: "queue.patient_entered_room", resourceType: "queue_ticket", resourceId: result.ticket.id, branchId, severity: "high", metadataJson: { patientId, encounterId: result.encounter.id, from: result.ticket.status, to: "in_room" } });
    await this.audit.record({ actorUserId: user.id, action: result.reusedDraft ? "VISIT_DOCTOR_SIGNATURE_ASSIGNED" : "doctor_visit.started", resourceType: "encounter", resourceId: result.encounter.id, branchId, severity: "high", metadataJson: { patientId, queueTicketId: result.ticket?.id ?? null, visitType: result.ticket?.visitType ?? null, reusedDraft: result.reusedDraft } });
    return this.visitState(patientId, result.encounter.id, user);
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

    const changedFields = Object.keys(dto).filter((field) => field !== "expectedUpdatedAt");
    if (!changedFields.length) return encounter;

    const data: Prisma.EncounterUpdateManyMutationInput = {};
    if (dto.chiefComplaint !== undefined) data.chiefComplaint = clean(dto.chiefComplaint);
    if (dto.complaintStatus !== undefined) {
      data.followUpJson = mergeComplaintLifecycle(encounter.followUpJson, dto.complaintStatus, {
        encounterId,
        recordedAt: encounter.createdAt
      });
    }
    if (dto.historyText !== undefined) data.historyText = clean(dto.historyText);
    if (dto.examText !== undefined) data.examText = clean(dto.examText);
    if (dto.assessmentText !== undefined) data.assessmentText = clean(dto.assessmentText);
    if (dto.planText !== undefined) data.planText = clean(dto.planText);
    if (dto.examinationJson !== undefined) data.examinationJson = stampStructuredInput(dto.examinationJson, encounterId, user.id);

    const expectedUpdatedAt = dto.expectedUpdatedAt ? new Date(dto.expectedUpdatedAt) : encounter.updatedAt;
    const claimed = await this.prisma.encounter.updateMany({
      where: { id: encounterId, patientId, status: "draft", updatedAt: expectedUpdatedAt },
      data
    });
    if (claimed.count !== 1) {
      throw new ConflictException({
        code: "VISIT_DRAFT_STALE",
        message: "This visit changed in another tab or device. Reload the locked patient visit before saving again."
      });
    }

    const updated = await assertCanReferenceEncounter(this.prisma, encounterId, user, { patientId, requireDoctorScope: true });
    if (!updated) throw new NotFoundException("Doctor visit not found after saving.");

    await this.audit.record({
      actorUserId: user.id,
      action: "doctor_visit.encounter_draft_updated",
      resourceType: "encounter",
      resourceId: encounterId,
      branchId: updated.branchId,
      severity: "high",
      metadataJson: { patientId, changedFields, expectedUpdatedAt: expectedUpdatedAt.toISOString(), savedUpdatedAt: updated.updatedAt.toISOString() }
    });

    return updated;
  }

  async createFollowUp(patientId: string, encounterId: string, dto: CreateFollowUpDto, user: AuthUser, idempotencyKey?: string) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const encounter = await assertCanReferenceEncounter(this.prisma, encounterId, user, { patientId, requireDoctorScope: true });
    if (!encounter || encounter.status !== "draft") throw new BadRequestException("An active draft visit is required to add follow-up actions.");
    const attempt = idempotencyKey ? await this.idempotency.beginOrReplay({ userId: user.id, branchId: patient.branchId, scopeKey: encounterId, operation: "visit.follow_up.create", rawKey: idempotencyKey, requestPayload: dto }) : null;
    if (attempt?.isReplay) {
      if (!attempt.resourceId) throw new ConflictException({ code: "IDEMPOTENCY_REQUEST_IN_PROGRESS", message: "Follow-up save is still in progress." });
      const replay = await this.prisma.patientTask.findFirst({ where: { id: attempt.resourceId, patientId } });
      if (!replay) throw new ConflictException({ code: "IDEMPOTENCY_RESOURCE_MISSING", message: "Saved follow-up could not be reloaded." });
      return replay;
    }
    let task;
    try {
      task = await this.prisma.$transaction(async (tx) => {
        const created = await tx.patientTask.create({ data: { patientId, branchId: patient.branchId, createdByUserId: user.id, taskType: "schedule_follow_up", title: clean(dto.title) ?? "Follow-up visit", description: clean(dto.note), dueAt: dto.dueAt ? new Date(dto.dueAt) : null } });
        if (attempt) await this.idempotency.complete({ tx, recordId: attempt.recordId, responseStatus: 201, resourceType: "patient_task", resourceId: created.id });
        return created;
      });
    } catch (error) {
      if (attempt) await this.idempotency.failOrRelease({ recordId: attempt.recordId, safeReason: "Follow-up save failed.", releaseLock: true }).catch(() => undefined);
      throw error;
    }
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
    const [encounter, historySheet, careAssistFindings, prescriptions, investigationOrders, followUps, recentEncounters, pregnancyEpisode, infertilityEpisode] = await Promise.all([
      this.prisma.encounter.findFirst({
        where: { id: encounterId, patientId, ...doctorScope(user), ...patientBranchScope(user) },
        include: { doctor: { select: { id: true, displayName: true, doctorColor: true, doctorShortLabel: true } } }
      }),
      this.prisma.patientHistorySheet.findFirst({ where: { patientId }, orderBy: { updatedAt: "desc" }, include: { medicationHistoryItems: true, investigationHistoryItems: true, operationHistoryItems: true } }),
      this.prisma.careAssistFinding.findMany({ where: { patientId, encounterId }, orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }], take: 50 }),
      this.prisma.prescription.findMany({
        where: { patientId, encounterId, ...doctorScope(user), ...patientBranchScope(user) },
        include: { items: { include: { medicationGeneric: { include: { safetyProfile: true } } } } },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.investigationOrder.findMany({ where: { patientId, encounterId, ...doctorScope(user), ...patientBranchScope(user) }, include: { items: true }, orderBy: { createdAt: "desc" } }),
      this.prisma.patientTask.findMany({ where: { patientId, taskType: "schedule_follow_up" }, orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }], take: 20 })
      ,
      this.prisma.encounter.findMany({
        where: { patientId, status: "signed", id: { not: encounterId }, ...patientBranchScope(user) },
        select: { id: true, status: true, startedAt: true, signedAt: true, createdAt: true, examinationJson: true },
        orderBy: [{ signedAt: "desc" }, { createdAt: "desc" }],
        take: 24
      }),
      this.prisma.pregnancy.findFirst({
        where: { patientId, status: "active" },
        include: { datingAssessments: { where: { voidedAt: null }, orderBy: { createdAt: "desc" }, take: 5 } },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.infertilityEpisode.findFirst({
        where: { patientId, status: "active" },
        include: { cycles: { orderBy: { cycleNumber: "desc" }, take: 1, include: { monitoringVisits: { orderBy: { monitoringDate: "desc" }, take: 5 } } } },
        orderBy: { createdAt: "desc" }
      })
    ]);
    if (!encounter) throw new NotFoundException("Doctor visit not found.");
    return {
      workflow: visitWorkflow(),
      patient: patientSummary(patient),
      encounter: withDoctorSignature(encounter),
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
      followUps,
      recentEncounters,
      pregnancyEpisode,
      infertilityEpisode
    };
  }
}

function visitWorkflow() {
  return ["History", "Care Assist", "Encounter", "Prescription", "Investigations", "Follow-up", "Review and Print"];
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

function stampStructuredInput(value: Record<string, unknown>, encounterId: string, userId: string): Prisma.InputJsonValue {
  const snapshot = value.reproductiveSnapshot;
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return value as Prisma.InputJsonValue;
  return {
    ...value,
    reproductiveSnapshot: {
      ...(snapshot as Record<string, unknown>),
      encounterId,
      confirmedAt: new Date().toISOString(),
      confirmedByUserId: userId
    }
  } as Prisma.InputJsonValue;
}

export function normalizeDoctorColor(color: string | null | undefined, userId: string) {
  if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) return color.toUpperCase();
  const palette = ["#0F766E", "#2563EB", "#7C3AED", "#C2410C", "#BE123C", "#047857", "#4338CA", "#A16207"];
  const code = [...userId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[code % palette.length];
}

function withDoctorSignature(encounter: (Prisma.EncounterGetPayload<{ include: { doctor: { select: { id: true; displayName: true; doctorColor: true; doctorShortLabel: true } } } }>) | null) {
  if (!encounter) return encounter;
  const color = normalizeDoctorColor(encounter.doctorColorSnapshot ?? encounter.doctor.doctorColor, encounter.doctorId);
  return {
    ...encounter,
    doctorSignature: {
      doctorId: encounter.doctorId,
      startedByUserId: encounter.startedByUserId,
      doctorName: encounter.doctorDisplayNameSnapshot ?? encounter.doctor.displayName,
      doctorShortLabel: encounter.doctor.doctorShortLabel,
      doctorColor: color,
      startedAt: encounter.startedAt?.toISOString() ?? encounter.createdAt.toISOString()
    }
  };
}
