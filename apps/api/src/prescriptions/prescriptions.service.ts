import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceEncounter, assertCanReferencePatient } from "../auth/reference-scope";
import { doctorScope, patientBranchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePrescriptionDto, PrescriptionItemDto, UpdatePrescriptionDto } from "./dto";

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async create(dto: CreatePrescriptionDto, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, dto.patientId, user);
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, {
      patientId: dto.patientId,
      requireDoctorScope: true
    });

    try {
      const prescription = await this.prisma.prescription.create({
        data: {
          patientId: dto.patientId,
          encounterId: dto.encounterId ?? null,
          doctorId: user.id,
          notes: clean(dto.notes),
          items: { create: dto.items.map(toItemCreate) }
        },
        include: { items: true, patient: true, encounter: true }
      });

      await this.audit.record({
        actorUserId: user.id,
        action: "prescription.created",
        resourceType: "prescription",
        resourceId: prescription.id,
        severity: "high",
        metadataJson: { patientId: prescription.patientId, itemCount: prescription.items.length }
      });

      return prescription;
    } catch (error) {
      this.handlePrismaReferenceError(error);
    }
  }

  async list(user: AuthUser) {
    const prescriptions = await this.prisma.prescription.findMany({
      where: { ...patientBranchScope(user), ...doctorScope(user) },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { items: true, patient: true, encounter: true }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "prescription.list_read",
      resourceType: "prescription",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { count: prescriptions.length }
    });

    return prescriptions;
  }

  async get(id: string, user: AuthUser) {
    const prescription = await this.prisma.prescription.findFirst({
      where: { id, ...patientBranchScope(user), ...doctorScope(user) },
      include: { items: true, patient: true, encounter: true }
    });

    if (!prescription) {
      throw new NotFoundException("Prescription not found.");
    }

    await this.audit.record({
      actorUserId: user.id,
      action: "prescription.read",
      resourceType: "prescription",
      resourceId: prescription.id,
      branchId: prescription.patient.branchId,
      severity: "medium"
    });

    return prescription;
  }

  async update(id: string, dto: UpdatePrescriptionDto, user: AuthUser) {
    const existing = await this.get(id, user);

    if (existing.status === "signed") {
      throw new BadRequestException("Signed prescriptions cannot be edited.");
    }

    const prescription = await this.prisma.prescription.update({
      where: { id },
      data: {
        ...(dto.notes !== undefined ? { notes: clean(dto.notes) } : {}),
        ...(dto.items
          ? {
              items: {
                deleteMany: {},
                create: dto.items.map(toItemCreate)
              }
            }
          : {})
      },
      include: { items: true, patient: true, encounter: true }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "prescription.updated",
      resourceType: "prescription",
      resourceId: prescription.id,
      severity: "high",
      metadataJson: { changedFields: Object.keys(dto), itemCount: prescription.items.length }
    });

    return prescription;
  }

  async sign(id: string, user: AuthUser) {
    const existing = await this.get(id, user);

    if (existing.status === "signed") {
      throw new BadRequestException("Prescription is already signed.");
    }

    const prescription = await this.prisma.prescription.update({
      where: { id },
      data: { status: "signed", signedAt: new Date() },
      include: { items: true }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "prescription.signed",
      resourceType: "prescription",
      resourceId: prescription.id,
      severity: "high",
      metadataJson: { patientId: prescription.patientId, itemCount: prescription.items.length }
    });

    return prescription;
  }

  private handlePrismaReferenceError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new BadRequestException("Referenced patient, encounter, or doctor was not found.");
    }
    throw error;
  }
}

function toItemCreate(item: PrescriptionItemDto) {
  return {
    medicationName: item.medicationName.trim(),
    dose: clean(item.dose),
    route: clean(item.route),
    frequency: clean(item.frequency),
    duration: clean(item.duration),
    instructions: clean(item.instructions)
  };
}

function clean(value?: string) {
  return value?.trim() || null;
}
