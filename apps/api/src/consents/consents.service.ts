import { BadRequestException, Injectable } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CreateConsentDto } from "./dto";

@Injectable()
export class ConsentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async create(dto: CreateConsentDto, user: AuthUser) {
    const patient = await this.prisma.patient.findFirst({ where: { id: dto.patientId, ...branchScope(user) } });
    if (!patient) {
      throw new BadRequestException("Patient not found or outside allowed scope.");
    }

    const consent = await this.prisma.consentRecord.create({
      data: {
        patientId: patient.id,
        consentType: dto.consentType,
        status: dto.status,
        notes: dto.notes?.trim() || null,
        capturedByUserId: user.id
      }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "consent.created",
      resourceType: "consent_record",
      resourceId: consent.id,
      branchId: patient.branchId,
      severity: "high",
      metadataJson: {
        patientId: patient.id,
        consentType: consent.consentType,
        status: consent.status
      }
    });

    return consent;
  }

  async list(patientId: string, user: AuthUser) {
    if (!patientId) {
      throw new BadRequestException("patientId query parameter is required.");
    }

    const patient = await this.prisma.patient.findFirst({ where: { id: patientId, ...branchScope(user) } });
    if (!patient) {
      throw new BadRequestException("Patient not found or outside allowed scope.");
    }

    const consentRecords = await this.prisma.consentRecord.findMany({
      where: { patientId },
      orderBy: { capturedAt: "desc" },
      take: 100
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "consent.list_read",
      resourceType: "consent_record",
      branchId: patient.branchId,
      severity: "medium",
      metadataJson: { patientId, count: consentRecords.length }
    });

    return consentRecords;
  }
}
