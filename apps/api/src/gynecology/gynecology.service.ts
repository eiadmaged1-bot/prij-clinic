import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { GynecologyVisitTemplate, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceEncounter, assertCanReferencePatient } from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CreateGynecologyVisitDto } from "./dto";

@Injectable()
export class GynecologyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async createForPatient(patientId: string, dto: CreateGynecologyVisitDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, {
      patientId,
      requireDoctorScope: true
    });

    const visitDate = dto.visitDate ? new Date(dto.visitDate) : new Date();
    if (Number.isNaN(visitDate.getTime())) {
      throw new BadRequestException("Invalid visit date.");
    }

    const visit = await this.prisma.gynecologyVisit.create({
      data: {
        branchId: patient.branchId,
        patientId,
        encounterId: dto.encounterId ?? null,
        templateType: dto.templateType ?? GynecologyVisitTemplate.general,
        visitDate,
        followUpDate: parseDate(dto.followUpDate, "followUpDate"),
        ...cleanGynecologyFields(dto),
        createdByUserId: user.id
      },
      include: gynecologyVisitIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "gynecology_visit.created",
      resourceType: "gynecology_visit",
      resourceId: visit.id,
      branchId: visit.branchId,
      severity: "high",
      metadataJson: {
        patientId,
        templateType: visit.templateType,
        source: "patient_file",
        safety: "recording_only_clinician_interpretation_required"
      }
    });

    return visit;
  }

  async list(user: AuthUser, patientId?: string) {
    if (patientId) {
      await assertCanReferencePatient(this.prisma, patientId, user);
    }

    const visits = await this.prisma.gynecologyVisit.findMany({
      where: { ...(patientId ? { patientId } : {}), ...branchScope(user) },
      orderBy: { visitDate: "desc" },
      take: 100,
      include: gynecologyVisitIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "gynecology_visit.list_read",
      resourceType: "gynecology_visit",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { patientId, count: visits.length }
    });

    return visits;
  }

  async get(id: string, user: AuthUser) {
    const visit = await this.prisma.gynecologyVisit.findFirst({
      where: { id, ...branchScope(user) },
      include: gynecologyVisitIncludes
    });

    if (!visit) {
      throw new NotFoundException("Gynecology visit not found.");
    }

    await this.audit.record({
      actorUserId: user.id,
      action: "gynecology_visit.read",
      resourceType: "gynecology_visit",
      resourceId: visit.id,
      branchId: visit.branchId,
      severity: "medium",
      metadataJson: { patientId: visit.patientId, templateType: visit.templateType }
    });

    return visit;
  }
}

const gynecologyVisitIncludes = {
  patient: true,
  encounter: true,
  createdByUser: true
} satisfies Prisma.GynecologyVisitInclude;

const gynecologyTextFields = [
  "reasonForVisit",
  "menstrualHistory",
  "bleedingPattern",
  "painSymptoms",
  "dischargeSymptoms",
  "obstetricHistorySummary",
  "contraceptionHistory",
  "medicalSurgicalHistory",
  "examinationNotes",
  "doctorImpression",
  "doctorPlan",
  "cycleRegularity",
  "bleedingDuration",
  "bleedingAmount",
  "clots",
  "intermenstrualBleeding",
  "postcoitalBleeding",
  "associatedSymptoms",
  "pregnancyTestNote",
  "painOnset",
  "painDuration",
  "painSite",
  "relationToCycle",
  "painSeverity",
  "urinaryBowelSymptoms",
  "cyclePattern",
  "acneHirsutismNote",
  "weightMetabolicRiskNote",
  "ultrasoundNote",
  "labsNote",
  "findingSource",
  "sizeLocationNote",
  "symptoms",
  "followUpPlan",
  "currentMethod",
  "previousMethods",
  "contraindicationChecklist",
  "counselingNotes",
  "chosenMethod"
] as const;

function cleanGynecologyFields(dto: CreateGynecologyVisitDto) {
  const data: Record<string, string | null> = {};

  for (const field of gynecologyTextFields) {
    if (dto[field] !== undefined) {
      data[field] = dto[field]?.trim() || null;
    }
  }

  return data;
}

function parseDate(value: string | undefined, fieldName: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Invalid ${fieldName}.`);
  }
  return date;
}
