import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceAppointment, assertCanReferencePatient } from "../auth/reference-scope";
import { doctorScope, patientBranchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { complaintLifecycleFromJson, complaintStatusFromJson, mergeComplaintLifecycle } from "../complaints/complaint-lifecycle";
import { CreateEncounterDto, UpdateEncounterDto } from "./dto";

@Injectable()
export class EncountersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async create(dto: CreateEncounterDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);
    const appointment = await assertCanReferenceAppointment(this.prisma, dto.appointmentId, user, {
      patientId: dto.patientId,
      requireDoctorScope: true
    });
    const branchId = patient.branchId;

    if (!branchId) {
      throw new BadRequestException("Patient branch is required to create an encounter.");
    }

    if (appointment && appointment.branchId !== branchId) {
      throw new BadRequestException("Appointment does not match the selected patient and branch.");
    }

    try {
      const encounterId = randomUUID();
      const encounter = await this.prisma.encounter.create({
        data: {
          id: encounterId,
          branchId,
          patientId: dto.patientId,
          appointmentId: dto.appointmentId ?? null,
          doctorId: user.id,
          chiefComplaint: clean(dto.chiefComplaint),
          ...(dto.complaintStatus ? { followUpJson: mergeComplaintLifecycle(undefined, dto.complaintStatus, { encounterId, recordedAt: new Date() }) } : {}),
          historyText: clean(dto.historyText),
          examText: clean(dto.examText),
          assessmentText: clean(dto.assessmentText),
          planText: clean(dto.planText),
          doctorReviewedIntake: dto.doctorReviewedIntake ?? false,
          doctorReviewStatus: clean(dto.doctorReviewStatus),
          historyClarification: clean(dto.historyClarification),
          examinationJson: jsonOrNull(dto.examinationJson),
          ultrasoundFindingsJson: jsonOrNull(dto.ultrasoundFindingsJson),
          clinicalImpression: clean(dto.clinicalImpression),
          riskClassification: clean(dto.riskClassification),
          followUpJson: jsonOrNull(dto.followUpJson)
        }
      });

      await this.audit.record({
        actorUserId: user.id,
        action: "encounter.created",
        resourceType: "encounter",
        resourceId: encounter.id,
        branchId,
        severity: "high",
        metadataJson: { patientId: encounter.patientId, appointmentId: encounter.appointmentId }
      });

      return encounter;
    } catch (error) {
      this.handlePrismaReferenceError(error);
    }
  }

  async list(user: AuthUser) {
    const encounters = await this.prisma.encounter.findMany({
      where: { ...patientBranchScope(user), ...doctorScope(user) },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { patient: true, appointment: true, doctor: true }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "encounter.list_read",
      resourceType: "encounter",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { count: encounters.length }
    });

    return encounters.map(withSignature);
  }

  async get(id: string, user: AuthUser) {
    const encounter = await this.prisma.encounter.findFirst({
      where: { id, ...patientBranchScope(user), ...doctorScope(user) },
      include: { patient: true, appointment: true, doctor: true }
    });

    if (!encounter) {
      throw new NotFoundException("Encounter not found.");
    }

    await this.audit.record({
      actorUserId: user.id,
      action: "encounter.read",
      resourceType: "encounter",
      resourceId: encounter.id,
      branchId: encounter.patient.branchId,
      severity: "medium"
    });

    return withSignature(encounter);
  }

  async update(id: string, dto: UpdateEncounterDto, user: AuthUser) {
    const existing = await this.get(id, user);

    if (existing.status === "signed" || existing.status === "voided") {
      throw new BadRequestException("Signed or voided encounters cannot be edited. TODO: add correction/version workflow.");
    }

    if (dto.status !== undefined && dto.status !== existing.status) {
      throw new BadRequestException("Use a dedicated encounter state action to change encounter status.");
    }

    const data: Prisma.EncounterUpdateInput = {};
    if (dto.chiefComplaint !== undefined) data.chiefComplaint = clean(dto.chiefComplaint);
    if (dto.complaintStatus !== undefined) {
      data.followUpJson = mergeComplaintLifecycle(dto.followUpJson ?? existing.followUpJson, dto.complaintStatus, {
        encounterId: existing.id,
        recordedAt: existing.createdAt
      });
    }
    if (dto.historyText !== undefined) data.historyText = clean(dto.historyText);
    if (dto.examText !== undefined) data.examText = clean(dto.examText);
    if (dto.assessmentText !== undefined) data.assessmentText = clean(dto.assessmentText);
    if (dto.planText !== undefined) data.planText = clean(dto.planText);
    if (dto.doctorReviewedIntake !== undefined) data.doctorReviewedIntake = dto.doctorReviewedIntake;
    if (dto.doctorReviewStatus !== undefined) data.doctorReviewStatus = clean(dto.doctorReviewStatus);
    if (dto.historyClarification !== undefined) data.historyClarification = clean(dto.historyClarification);
    if (dto.examinationJson !== undefined) data.examinationJson = jsonOrNull(dto.examinationJson);
    if (dto.ultrasoundFindingsJson !== undefined) data.ultrasoundFindingsJson = jsonOrNull(dto.ultrasoundFindingsJson);
    if (dto.clinicalImpression !== undefined) data.clinicalImpression = clean(dto.clinicalImpression);
    if (dto.riskClassification !== undefined) data.riskClassification = clean(dto.riskClassification);
    if (dto.followUpJson !== undefined && dto.complaintStatus === undefined) data.followUpJson = jsonOrNull(dto.followUpJson);

    const encounter = await this.prisma.encounter.update({ where: { id }, data });

    await this.audit.record({
      actorUserId: user.id,
      action: "encounter.updated",
      resourceType: "encounter",
      resourceId: encounter.id,
      branchId: encounter.branchId,
      severity: "high",
      metadataJson: { changedFields: Object.keys(dto), fromStatus: existing.status, toStatus: encounter.status }
    });

    return encounter;
  }

  async sign(id: string, user: AuthUser) {
    const existing = await this.get(id, user);

    if (existing.status === "signed" && complaintLifecycleFromJson(existing.followUpJson)) {
      return existing;
    }

    if (existing.status !== "draft") {
      throw new BadRequestException("Only draft encounters can be signed.");
    }

    const completedAt = new Date();
    const { encounter, queueTicketId } = await this.prisma.$transaction(async (tx) => {
      const signed = await tx.encounter.update({
        where: { id },
        data: {
          status: "signed",
          signedAt: completedAt,
          signedByUserId: user.id,
          ...(existing.chiefComplaint || complaintLifecycleFromJson(existing.followUpJson) ? {
            followUpJson: mergeComplaintLifecycle(existing.followUpJson, complaintStatusFromJson(existing.followUpJson), {
              encounterId: existing.id,
              recordedAt: existing.createdAt,
              signedAt: completedAt
            })
          } : {})
        }
      });
      const queueTicket = await tx.queueTicket.findFirst({ where: { patientId: signed.patientId, branchId: signed.branchId, status: "in_room" }, orderBy: { checkedInAt: "desc" } });
      if (queueTicket) {
        await tx.queueTicket.update({ where: { id: queueTicket.id }, data: { status: "completed", completedAt } });
        await tx.activeQueueTicketLock.deleteMany({ where: { queueTicketId: queueTicket.id } });
        await tx.auditLog.create({ data: { actorUserId: user.id, action: "queue.completed_with_encounter", resourceType: "queue_ticket", resourceId: queueTicket.id, branchId: signed.branchId, severity: "high", metadataJson: { patientId: signed.patientId, encounterId: signed.id, from: "in_room", to: "completed" } } });
      }
      return { encounter: signed, queueTicketId: queueTicket?.id ?? null };
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "encounter.signed",
      resourceType: "encounter",
      resourceId: encounter.id,
      branchId: encounter.branchId,
      severity: "high",
      metadataJson: { patientId: encounter.patientId, queueTicketId }
    });

    return encounter;
  }

  async voidEncounter(encounterId: string, userId: string, reason: string, user?: AuthUser) {
    const trimmedReason = reason?.trim();

    if (!trimmedReason) {
      throw new BadRequestException("Void reason is required.");
    }

    return this.prisma.$transaction(async (tx) => {
      const encounter = await tx.encounter.findFirst({
        where: {
          id: encounterId,
          ...(user ? patientBranchScope(user) : {}),
          ...(user ? doctorScope(user) : {})
        },
        select: {
          id: true,
          branchId: true,
          patientId: true,
          status: true
        }
      });

      if (!encounter) {
        throw new NotFoundException("Encounter not found.");
      }

      if (encounter.status !== "draft") {
        throw new ConflictException("Only draft encounters can be voided.");
      }

      const voidedAt = new Date();
      const updated = await tx.encounter.update({
        where: { id: encounterId },
        data: {
          status: "voided",
          voidedAt,
          voidedByUserId: userId,
          voidReason: trimmedReason
        }
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "encounter.voided",
          resourceType: "encounter",
          resourceId: encounter.id,
          branchId: encounter.branchId,
          severity: "high",
          reason: trimmedReason,
          metadataJson: {
            patientId: encounter.patientId,
            fromStatus: encounter.status,
            toStatus: updated.status
          }
        } as unknown as never
      });

      return updated;
    });
  }

  private handlePrismaReferenceError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new BadRequestException("Referenced patient, appointment, or doctor was not found.");
    }
    throw error;
  }
}

function clean(value?: string) {
  return value?.trim() || null;
}

function jsonOrNull(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  return value === undefined || value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

function withSignature<T extends { doctorId: string; startedByUserId: string | null; doctorDisplayNameSnapshot: string | null; doctorColorSnapshot: string | null; startedAt: Date | null; createdAt: Date; doctor?: { displayName: string; doctorColor: string | null; doctorShortLabel: string | null } }>(encounter: T) {
  const color = normalizeDoctorColor(encounter.doctorColorSnapshot ?? encounter.doctor?.doctorColor, encounter.doctorId);
  return {
    ...encounter,
    doctorSignature: {
      doctorId: encounter.doctorId,
      startedByUserId: encounter.startedByUserId,
      doctorName: encounter.doctorDisplayNameSnapshot ?? encounter.doctor?.displayName ?? "Doctor",
      doctorShortLabel: encounter.doctor?.doctorShortLabel ?? null,
      doctorColor: color,
      startedAt: encounter.startedAt?.toISOString() ?? encounter.createdAt.toISOString()
    }
  };
}

function normalizeDoctorColor(color: string | null | undefined, userId: string) {
  if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) return color.toUpperCase();
  const palette = ["#0F766E", "#2563EB", "#7C3AED", "#C2410C", "#BE123C", "#047857", "#4338CA", "#A16207"];
  const code = [...userId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[code % palette.length];
}
