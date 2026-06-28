import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceEncounter, assertCanReferencePatient, assertCanReferencePregnancy } from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CreateObUltrasoundDto, CreatePregnancyDto, UpdateObUltrasoundDto, UpdatePregnancyDto } from "./dto";

@Injectable()
export class PregnancyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async createPregnancy(dto: CreatePregnancyDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);

    try {
      const pregnancy = await this.prisma.pregnancy.create({
        data: {
          patientId: dto.patientId,
          branchId: patient?.branchId,
          status: dto.status ?? "active",
          gravida: dto.gravida,
          para: dto.para,
          lmpDate: toDate(dto.lmpDate),
          estimatedDueDate: toDate(dto.estimatedDueDate),
          riskLevel: clean(dto.riskLevel),
          notes: clean(dto.notes),
          createdByUserId: user.id
        },
        include: pregnancyIncludes
      });

      await this.audit.record({
        actorUserId: user.id,
        action: "pregnancy.created",
        resourceType: "pregnancy",
        resourceId: pregnancy.id,
        severity: "high",
        metadataJson: { patientId: pregnancy.patientId, status: pregnancy.status }
      });

      return pregnancy;
    } catch (error) {
      this.handlePrismaReferenceError(error);
    }
  }

  async listPregnancies(user: AuthUser) {
    const pregnancies = await this.prisma.pregnancy.findMany({
      where: branchScope(user),
      orderBy: { createdAt: "desc" },
      take: 100,
      include: pregnancyIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "pregnancy.list_read",
      resourceType: "pregnancy",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { count: pregnancies.length }
    });

    return pregnancies;
  }

  async getPregnancy(id: string, user: AuthUser) {
    const pregnancy = await this.prisma.pregnancy.findFirst({
      where: { id, ...branchScope(user) },
      include: pregnancyIncludes
    });

    if (!pregnancy) {
      throw new NotFoundException("Pregnancy record not found.");
    }

    await this.audit.record({
      actorUserId: user.id,
      action: "pregnancy.read",
      resourceType: "pregnancy",
      resourceId: pregnancy.id,
      branchId: pregnancy.branchId,
      severity: "medium",
      metadataJson: { status: pregnancy.status }
    });

    return pregnancy;
  }

  async updatePregnancy(id: string, dto: UpdatePregnancyDto, user: AuthUser) {
    const existing = await this.getPregnancy(id, user);
    const data: Prisma.PregnancyUpdateInput = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.gravida !== undefined) data.gravida = dto.gravida;
    if (dto.para !== undefined) data.para = dto.para;
    if (dto.lmpDate !== undefined) data.lmpDate = toDate(dto.lmpDate);
    if (dto.estimatedDueDate !== undefined) data.estimatedDueDate = toDate(dto.estimatedDueDate);
    if (dto.riskLevel !== undefined) data.riskLevel = clean(dto.riskLevel);
    if (dto.notes !== undefined) data.notes = clean(dto.notes);

    const pregnancy = await this.prisma.pregnancy.update({
      where: { id },
      data,
      include: pregnancyIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "pregnancy.updated",
      resourceType: "pregnancy",
      resourceId: pregnancy.id,
      severity: "high",
      metadataJson: { changedFields: Object.keys(dto), fromStatus: existing.status, toStatus: pregnancy.status }
    });

    return pregnancy;
  }

  async createObUltrasound(dto: CreateObUltrasoundDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);
    await assertCanReferencePregnancy(this.prisma, dto.pregnancyId, user, { patientId: dto.patientId });
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, {
      patientId: dto.patientId,
      requireDoctorScope: true
    });

    try {
      const performedAt = toDateTime(dto.performedAt);
      if (dto.performedAt !== undefined && !performedAt) {
        throw new BadRequestException("Invalid performedAt.");
      }

      const ultrasound = await this.prisma.obUltrasound.create({
        data: {
          patientId: dto.patientId,
          branchId: patient?.branchId,
          pregnancyId: dto.pregnancyId ?? null,
          encounterId: dto.encounterId ?? null,
          performedAt: performedAt ?? new Date(),
          gestationalAgeWeeks: dto.gestationalAgeWeeks,
          gestationalAgeDays: dto.gestationalAgeDays,
          fetalHeartRateBpm: dto.fetalHeartRateBpm,
          presentation: clean(dto.presentation),
          placenta: clean(dto.placenta),
          amnioticFluid: clean(dto.amnioticFluid),
          impressionText: clean(dto.impressionText),
          createdByUserId: user.id
        },
        include: obUltrasoundIncludes
      });

      await this.audit.record({
        actorUserId: user.id,
        action: "ob_ultrasound.created",
        resourceType: "ob_ultrasound",
        resourceId: ultrasound.id,
        severity: "high",
        metadataJson: { patientId: ultrasound.patientId, pregnancyId: ultrasound.pregnancyId }
      });

      return ultrasound;
    } catch (error) {
      this.handlePrismaReferenceError(error);
    }
  }

  async listObUltrasounds(user: AuthUser) {
    const obUltrasounds = await this.prisma.obUltrasound.findMany({
      where: branchScope(user),
      orderBy: { performedAt: "desc" },
      take: 100,
      include: obUltrasoundIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "ob_ultrasound.list_read",
      resourceType: "ob_ultrasound",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { count: obUltrasounds.length }
    });

    return obUltrasounds;
  }

  async getObUltrasound(id: string, user: AuthUser) {
    const ultrasound = await this.prisma.obUltrasound.findFirst({
      where: { id, ...branchScope(user) },
      include: obUltrasoundIncludes
    });

    if (!ultrasound) {
      throw new NotFoundException("OB ultrasound record not found.");
    }

    await this.audit.record({
      actorUserId: user.id,
      action: "ob_ultrasound.read",
      resourceType: "ob_ultrasound",
      resourceId: ultrasound.id,
      branchId: ultrasound.branchId,
      severity: "medium",
      metadataJson: { status: ultrasound.status, pregnancyId: ultrasound.pregnancyId }
    });

    return ultrasound;
  }

  async updateObUltrasound(id: string, dto: UpdateObUltrasoundDto, user: AuthUser) {
    const existing = await this.getObUltrasound(id, user);

    if (existing.status === "reviewed" && dto.status !== "voided") {
      throw new BadRequestException("Reviewed OB ultrasound records require a correction workflow before edits.");
    }

    await assertCanReferencePatient(this.prisma, existing.patientId, user);
    await assertCanReferencePregnancy(this.prisma, dto.pregnancyId, user, { patientId: existing.patientId });
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, {
      patientId: existing.patientId,
      requireDoctorScope: true
    });

    const data: Prisma.ObUltrasoundUpdateInput = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.performedAt !== undefined) {
      const performedAt = toDateTime(dto.performedAt);
      if (!performedAt) {
        throw new BadRequestException("Invalid performedAt.");
      }
      data.performedAt = performedAt;
    }
    if (dto.gestationalAgeWeeks !== undefined) data.gestationalAgeWeeks = dto.gestationalAgeWeeks;
    if (dto.gestationalAgeDays !== undefined) data.gestationalAgeDays = dto.gestationalAgeDays;
    if (dto.fetalHeartRateBpm !== undefined) data.fetalHeartRateBpm = dto.fetalHeartRateBpm;
    if (dto.presentation !== undefined) data.presentation = clean(dto.presentation);
    if (dto.placenta !== undefined) data.placenta = clean(dto.placenta);
    if (dto.amnioticFluid !== undefined) data.amnioticFluid = clean(dto.amnioticFluid);
    if (dto.impressionText !== undefined) data.impressionText = clean(dto.impressionText);

    const ultrasound = await this.prisma.obUltrasound.update({
      where: { id },
      data,
      include: obUltrasoundIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "ob_ultrasound.updated",
      resourceType: "ob_ultrasound",
      resourceId: ultrasound.id,
      severity: "high",
      metadataJson: { changedFields: Object.keys(dto), fromStatus: existing.status, toStatus: ultrasound.status }
    });

    return ultrasound;
  }

  async reviewObUltrasound(id: string, user: AuthUser) {
    const existing = await this.getObUltrasound(id, user);
    if (existing.status === "voided") {
      throw new BadRequestException("Voided OB ultrasound records cannot be reviewed.");
    }

    const ultrasound = await this.prisma.obUltrasound.update({
      where: { id },
      data: { status: "reviewed", reviewedAt: new Date(), reviewedByUserId: user.id },
      include: obUltrasoundIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "ob_ultrasound.reviewed",
      resourceType: "ob_ultrasound",
      resourceId: ultrasound.id,
      severity: "high",
      metadataJson: { patientId: ultrasound.patientId, fromStatus: existing.status }
    });

    return ultrasound;
  }

  private handlePrismaReferenceError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new BadRequestException("Referenced patient, pregnancy, encounter, or user was not found.");
    }
    throw error;
  }
}

const pregnancyIncludes = {
  patient: true,
  obUltrasounds: true
} satisfies Prisma.PregnancyInclude;

const obUltrasoundIncludes = {
  patient: true,
  pregnancy: true,
  encounter: true
} satisfies Prisma.ObUltrasoundInclude;

function clean(value?: string) {
  return value?.trim() || null;
}

function toDate(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function toDateTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
