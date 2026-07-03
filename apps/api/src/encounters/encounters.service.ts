import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceAppointment, assertCanReferencePatient } from "../auth/reference-scope";
import { doctorScope, patientBranchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
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
      const encounter = await this.prisma.encounter.create({
        data: {
          branchId,
          patientId: dto.patientId,
          appointmentId: dto.appointmentId ?? null,
          doctorId: user.id,
          chiefComplaint: clean(dto.chiefComplaint),
          historyText: clean(dto.historyText),
          examText: clean(dto.examText),
          assessmentText: clean(dto.assessmentText),
          planText: clean(dto.planText)
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
      include: { patient: true, appointment: true }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "encounter.list_read",
      resourceType: "encounter",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { count: encounters.length }
    });

    return encounters;
  }

  async get(id: string, user: AuthUser) {
    const encounter = await this.prisma.encounter.findFirst({
      where: { id, ...patientBranchScope(user), ...doctorScope(user) },
      include: { patient: true, appointment: true }
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

    return encounter;
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
    if (dto.historyText !== undefined) data.historyText = clean(dto.historyText);
    if (dto.examText !== undefined) data.examText = clean(dto.examText);
    if (dto.assessmentText !== undefined) data.assessmentText = clean(dto.assessmentText);
    if (dto.planText !== undefined) data.planText = clean(dto.planText);

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

    if (existing.status !== "draft") {
      throw new BadRequestException("Only draft encounters can be signed.");
    }

    const encounter = await this.prisma.encounter.update({
      where: { id },
      data: { status: "signed", signedAt: new Date(), signedByUserId: user.id }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "encounter.signed",
      resourceType: "encounter",
      resourceId: encounter.id,
      branchId: encounter.branchId,
      severity: "high",
      metadataJson: { patientId: encounter.patientId }
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
