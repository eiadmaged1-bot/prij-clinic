import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
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
    await this.ensurePatient(dto.patientId);
    await this.ensureAppointmentMatches(dto.patientId, dto.appointmentId);

    try {
      const encounter = await this.prisma.encounter.create({
        data: {
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

    if (existing.status === "signed") {
      throw new BadRequestException("Signed encounters cannot be edited. TODO: add correction/version workflow.");
    }

    const data: Prisma.EncounterUpdateInput = {};
    if (dto.chiefComplaint !== undefined) data.chiefComplaint = clean(dto.chiefComplaint);
    if (dto.historyText !== undefined) data.historyText = clean(dto.historyText);
    if (dto.examText !== undefined) data.examText = clean(dto.examText);
    if (dto.assessmentText !== undefined) data.assessmentText = clean(dto.assessmentText);
    if (dto.planText !== undefined) data.planText = clean(dto.planText);
    if (dto.status !== undefined) data.status = dto.status;

    const encounter = await this.prisma.encounter.update({ where: { id }, data });

    await this.audit.record({
      actorUserId: user.id,
      action: "encounter.updated",
      resourceType: "encounter",
      resourceId: encounter.id,
      severity: "high",
      metadataJson: { changedFields: Object.keys(dto), fromStatus: existing.status, toStatus: encounter.status }
    });

    return encounter;
  }

  async sign(id: string, user: AuthUser) {
    const existing = await this.get(id, user);

    if (existing.status === "signed") {
      throw new BadRequestException("Encounter is already signed.");
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
      severity: "high",
      metadataJson: { patientId: encounter.patientId }
    });

    return encounter;
  }

  private async ensurePatient(patientId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new BadRequestException("Patient not found.");
  }

  private async ensureAppointmentMatches(patientId: string, appointmentId?: string) {
    if (!appointmentId) return;
    const appointment = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment || appointment.patientId !== patientId) {
      throw new BadRequestException("Appointment does not match the selected patient.");
    }
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
