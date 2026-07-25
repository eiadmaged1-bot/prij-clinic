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
    const appointment = await assertCanReferenceAppointment(this.prisma, dto.appointmentId, user, { patientId, requireDoctorScope: true });
    const doctorProfile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, displayName: true, doctorColor: true, doctorShortLabel: true }
    });
    if (!doctorProfile) throw new BadRequestException("Doctor profile is required to start a visit.");
    const doctorColor = normalizeDoctorColor(doctorProfile.doctorColor, user.id);
    const existing = await this.prisma.encounter.findFirst({
      where: { patientId, status: "draft", ...doctorScope(user), ...patientBranchScope(user) },
      orderBy: { createdAt: "desc" }
    });

    const encounter = existing ?? await this.prisma.encounter.create({
      data: {
        patientId,
        branchId: patient.branchId,
        appointmentId: appointment?.id ?? null,
        doctorId: user.id,
        startedByUserId: user.id,
        doctorDisplayNameSnapshot: doctorProfile.displayName,
        doctorColorSnapshot: doctorColor,
        startedAt: new Date()
      }
    });

    const stampedEncounter = existing && (!existing.startedByUserId || !existing.doctorDisplayNameSnapshot || !existing.doctorColorSnapshot || !existing.startedAt)
      ? await this.prisma.encounter.update({
          where: { id: existing.id },
          data: {
            startedByUserId: existing.startedByUserId ?? user.id,
            doctorDisplayNameSnapshot: existing.doctorDisplayNameSnapshot ?? doctorProfile.displayName,
            doctorColorSnapshot: existing.doctorColorSnapshot ?? doctorColor,
            startedAt: existing.startedAt ?? new Date()
          }
        })
      : encounter;

    const { start: queueDate } = this.clinicTime.getClinicDayBounds(this.clinicTime.getClinicDate());
    const queueTicket = await this.prisma.queueTicket.findFirst({
      where: { patientId, branchId: patient.branchId, queueDate, status: { in: ["waiting", "called"] } },
      orderBy: { checkedInAt: "asc" }
    });
    if (queueTicket) {
      await this.prisma.queueTicket.update({ where: { id: queueTicket.id }, data: { status: "in_room", calledAt: queueTicket.calledAt ?? new Date() } });
      await this.audit.record({ actorUserId: user.id, action: "queue.patient_entered_room", resourceType: "queue_ticket", resourceId: queueTicket.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId, encounterId: stampedEncounter.id, from: queueTicket.status, to: "in_room" } });
    }

    if (!doctorProfile.doctorColor) {
      await this.prisma.user.update({ where: { id: user.id }, data: { doctorColor } });
    }

    await this.audit.record({
      actorUserId: user.id,
      action: existing ? "VISIT_DOCTOR_SIGNATURE_ASSIGNED" : "doctor_visit.started",
      resourceType: "encounter",
      resourceId: stampedEncounter.id,
      branchId: patient.branchId,
      severity: "high",
      metadataJson: {
        patientId,
        reusedDraft: Boolean(existing),
        appointmentId: appointment?.id ?? null,
        startedByUserId: stampedEncounter.startedByUserId,
        doctorDisplayNameSnapshot: stampedEncounter.doctorDisplayNameSnapshot,
        doctorColorSnapshot: stampedEncounter.doctorColorSnapshot
        , legacyEvent: existing ? "VISIT_DOCTOR_SIGNATURE_ASSIGNED" : "DOCTOR_VISIT_STARTED",
        queueTicketId: queueTicket?.id ?? null
      }
    });

    return this.visitState(patientId, stampedEncounter.id, user);
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
        ...(dto.complaintStatus !== undefined ? {
          followUpJson: mergeComplaintLifecycle(encounter.followUpJson, dto.complaintStatus, {
            encounterId,
            recordedAt: encounter.createdAt
          })
        } : {}),
        ...(dto.historyText !== undefined ? { historyText: clean(dto.historyText) } : {}),
        ...(dto.examText !== undefined ? { examText: clean(dto.examText) } : {}),
        ...(dto.assessmentText !== undefined ? { assessmentText: clean(dto.assessmentText) } : {}),
        ...(dto.planText !== undefined ? { planText: clean(dto.planText) } : {}),
        ...(dto.examinationJson !== undefined ? { examinationJson: stampStructuredInput(dto.examinationJson, encounterId, user.id) } : {})
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
