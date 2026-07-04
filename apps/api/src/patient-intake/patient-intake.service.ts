import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PatientIntakeStatus, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceEncounter, assertCanReferencePatient } from "../auth/reference-scope";
import { isOwnerOrAdmin } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { PatientIntakeDto, ReviewPatientIntakeDto, UpdatePatientIntakeDto } from "./dto";

@Injectable()
export class PatientIntakeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async create(dto: PatientIntakeDto, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, dto.patientId, user);
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, { patientId: dto.patientId });

    const intake = await this.prisma.patientIntake.create({
      data: {
        patientId: dto.patientId,
        encounterId: dto.encounterId ?? null,
        intakeType: dto.intakeType ?? "new_patient",
        patientReportedJson: jsonOrNull(dto.patientReportedJson),
        administrativeJson: jsonOrNull(dto.administrativeJson),
        vitalsJson: jsonOrNull(dto.vitalsJson),
        obsIntakeJson: jsonOrNull(dto.obsIntakeJson),
        gynIntakeJson: jsonOrNull(dto.gynIntakeJson),
        redFlagsJson: jsonOrNull(dto.redFlagsJson),
        attributionJson: jsonOrNull(attribution(user, "secretary_intake")),
        enteredByUserId: user.id
      }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "patient_intake.created",
      resourceType: "patient_intake",
      resourceId: intake.id,
      branchId: user.branchId,
      severity: "high",
      metadataJson: { patientId: intake.patientId, status: intake.status, sourceLabel: "secretary_intake" }
    });

    return intake;
  }

  list(user: AuthUser, patientId?: string, status?: PatientIntakeStatus) {
    return this.prisma.patientIntake.findMany({
      where: { ...(patientId ? { patientId } : {}), ...(status ? { status } : {}), ...intakeBranchScope(user) },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { patient: true, encounter: true }
    });
  }

  async get(id: string, user: AuthUser) {
    const intake = await this.prisma.patientIntake.findFirst({
      where: { id, ...intakeBranchScope(user) },
      include: { patient: true, encounter: true }
    });
    if (!intake) throw new NotFoundException("Patient intake not found.");
    return intake;
  }

  async update(id: string, dto: UpdatePatientIntakeDto, user: AuthUser) {
    const existing = await this.get(id, user);
    if (existing.status === "signed_locked") {
      throw new BadRequestException("Signed intake cannot be edited.");
    }
    if (existing.status === "reviewed_by_doctor" && !hasClinicalRole(user)) {
      throw new BadRequestException("Reviewed intake can only be changed by clinical staff.");
    }

    const intake = await this.prisma.patientIntake.update({
      where: { id },
      data: {
        ...(dto.intakeType ? { intakeType: dto.intakeType } : {}),
        ...(dto.patientReportedJson !== undefined ? { patientReportedJson: jsonOrNull(dto.patientReportedJson) } : {}),
        ...(dto.administrativeJson !== undefined ? { administrativeJson: jsonOrNull(dto.administrativeJson) } : {}),
        ...(dto.vitalsJson !== undefined ? { vitalsJson: jsonOrNull(dto.vitalsJson) } : {}),
        ...(dto.obsIntakeJson !== undefined ? { obsIntakeJson: jsonOrNull(dto.obsIntakeJson) } : {}),
        ...(dto.gynIntakeJson !== undefined ? { gynIntakeJson: jsonOrNull(dto.gynIntakeJson) } : {}),
        ...(dto.redFlagsJson !== undefined ? { redFlagsJson: jsonOrNull(dto.redFlagsJson) } : {}),
        attributionJson: jsonOrNull(attribution(user, "secretary_intake"))
      }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "patient_intake.updated",
      resourceType: "patient_intake",
      resourceId: intake.id,
      branchId: user.branchId,
      severity: "high",
      metadataJson: { changedFields: Object.keys(dto), patientId: intake.patientId }
    });

    return intake;
  }

  async submit(id: string, user: AuthUser) {
    const existing = await this.get(id, user);
    if (existing.status === "signed_locked") throw new BadRequestException("Signed intake cannot be submitted.");

    const intake = await this.prisma.patientIntake.update({
      where: { id },
      data: { status: "waiting_for_doctor_review" },
      include: { patient: true, encounter: true }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "patient_intake.submitted",
      resourceType: "patient_intake",
      resourceId: intake.id,
      branchId: user.branchId,
      severity: "high",
      metadataJson: { from: existing.status, to: intake.status, patientId: intake.patientId }
    });

    return intake;
  }

  async review(id: string, dto: ReviewPatientIntakeDto, user: AuthUser) {
    const existing = await this.get(id, user);
    await assertCanReferenceEncounter(this.prisma, dto.encounterId ?? existing.encounterId ?? undefined, user, {
      patientId: existing.patientId,
      requireDoctorScope: true
    });

    const intake = await this.prisma.patientIntake.update({
      where: { id },
      data: {
        status: "reviewed_by_doctor",
        encounterId: dto.encounterId ?? existing.encounterId,
        reviewedByDoctorId: user.id,
        reviewedAt: new Date()
      },
      include: { patient: true, encounter: true }
    });

    if (intake.encounterId) {
      await this.prisma.encounter.update({
        where: { id: intake.encounterId },
        data: { doctorReviewedIntake: true, doctorReviewStatus: "reviewed_by_doctor" }
      });
    }

    await this.audit.record({
      actorUserId: user.id,
      action: "patient_intake.reviewed",
      resourceType: "patient_intake",
      resourceId: intake.id,
      branchId: user.branchId,
      severity: "high",
      metadataJson: { patientId: intake.patientId, encounterId: intake.encounterId }
    });

    return intake;
  }

  async sign(id: string, user: AuthUser) {
    const existing = await this.get(id, user);
    if (existing.status !== "reviewed_by_doctor") {
      throw new BadRequestException("Doctor review is required before signing intake.");
    }

    const intake = await this.prisma.patientIntake.update({
      where: { id },
      data: { status: "signed_locked", signedByDoctorId: user.id, signedAt: new Date() },
      include: { patient: true, encounter: true }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "patient_intake.signed",
      resourceType: "patient_intake",
      resourceId: intake.id,
      branchId: user.branchId,
      severity: "high",
      metadataJson: { patientId: intake.patientId }
    });

    return intake;
  }
}

function attribution(user: AuthUser, sourceLabel: string) {
  return {
    enteredByRole: user.roles[0] ?? "staff",
    enteredByUserId: user.id,
    sourceLabel,
    note: "Patient-reported or secretary-entered until doctor review."
  };
}

function hasClinicalRole(user: AuthUser) {
  return user.roles.some((role) => ["Owner", "Admin", "Doctor", "Nurse"].includes(role));
}

function intakeBranchScope(user: AuthUser) {
  if (isOwnerOrAdmin(user)) return {};
  return { patient: { branchId: user.branchId ?? "00000000-0000-0000-0000-000000000000" } };
}

function jsonOrNull(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  return value === undefined || value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}
