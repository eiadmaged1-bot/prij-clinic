import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReportDto, UpdateReportDto } from "./dto";

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async create(dto: CreateReportDto, user: AuthUser) {
    const patient = await this.ensurePatient(dto.patientId);
    await this.ensureEncounterMatches(dto.patientId, dto.encounterId);
    await this.ensureInvestigationMatches(dto.patientId, dto.investigationOrderId);

    try {
      const report = await this.prisma.report.create({
        data: {
          patientId: dto.patientId,
          branchId: patient.branchId,
          encounterId: dto.encounterId ?? null,
          investigationOrderId: dto.investigationOrderId ?? null,
          category: dto.category,
          title: dto.title.trim(),
          source: clean(dto.source),
          fileReference: clean(dto.fileReference),
          resultSummary: clean(dto.resultSummary),
          uploadedByUserId: user.id
        },
        include: reportIncludes
      });

      await this.audit.record({
        actorUserId: user.id,
        action: "report.created",
        resourceType: "report",
        resourceId: report.id,
        severity: "high",
        metadataJson: { patientId: report.patientId, category: report.category, status: report.status }
      });

      return report;
    } catch (error) {
      this.handlePrismaReferenceError(error);
    }
  }

  list() {
    return this.prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: reportIncludes
    });
  }

  async get(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: reportIncludes
    });

    if (!report) {
      throw new NotFoundException("Report not found.");
    }

    return report;
  }

  async update(id: string, dto: UpdateReportDto, user: AuthUser) {
    const existing = await this.get(id);

    if (existing.status === "reviewed" && dto.status !== "voided") {
      throw new BadRequestException("Reviewed reports require a correction workflow before edits.");
    }

    const data: Prisma.ReportUpdateInput = {};
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.source !== undefined) data.source = clean(dto.source);
    if (dto.fileReference !== undefined) data.fileReference = clean(dto.fileReference);
    if (dto.resultSummary !== undefined) data.resultSummary = clean(dto.resultSummary);

    const report = await this.prisma.report.update({
      where: { id },
      data,
      include: reportIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "report.updated",
      resourceType: "report",
      resourceId: report.id,
      severity: "high",
      metadataJson: { changedFields: Object.keys(dto), fromStatus: existing.status, toStatus: report.status }
    });

    return report;
  }

  async review(id: string, user: AuthUser) {
    const existing = await this.get(id);
    if (existing.status === "voided") {
      throw new BadRequestException("Voided reports cannot be reviewed.");
    }

    const report = await this.prisma.report.update({
      where: { id },
      data: { status: "reviewed", reviewedAt: new Date(), reviewedByUserId: user.id },
      include: reportIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "report.reviewed",
      resourceType: "report",
      resourceId: report.id,
      severity: "high",
      metadataJson: { patientId: report.patientId, fromStatus: existing.status }
    });

    return report;
  }

  private async ensurePatient(patientId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new BadRequestException("Patient not found.");
    return patient;
  }

  private async ensureEncounterMatches(patientId: string, encounterId?: string) {
    if (!encounterId) return;
    const encounter = await this.prisma.encounter.findUnique({ where: { id: encounterId } });
    if (!encounter || encounter.patientId !== patientId) {
      throw new BadRequestException("Encounter does not match the selected patient.");
    }
  }

  private async ensureInvestigationMatches(patientId: string, investigationOrderId?: string) {
    if (!investigationOrderId) return;
    const order = await this.prisma.investigationOrder.findUnique({ where: { id: investigationOrderId } });
    if (!order || order.patientId !== patientId) {
      throw new BadRequestException("Investigation order does not match the selected patient.");
    }
  }

  private handlePrismaReferenceError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new BadRequestException("Referenced patient, encounter, investigation order, or user was not found.");
    }
    throw error;
  }
}

const reportIncludes = {
  patient: true,
  encounter: true,
  investigationOrder: true
} satisfies Prisma.ReportInclude;

function clean(value?: string) {
  return value?.trim() || null;
}
