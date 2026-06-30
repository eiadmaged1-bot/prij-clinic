import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InvestigationResultReviewStatus, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceInvestigationOrder, assertCanReferencePatient } from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInvestigationResultDto, ReviewInvestigationResultDto, UpdateInvestigationResultDto, VoidInvestigationResultDto } from "./dto";

const includeResult = { patient: true, order: true, report: true } satisfies Prisma.InvestigationResultInclude;

@Injectable()
export class InvestigationResultsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async create(dto: CreateInvestigationResultDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);
    await assertCanReferenceInvestigationOrder(this.prisma, dto.orderId, user, { patientId: dto.patientId, requireDoctorScope: true });

    const result = await this.prisma.investigationResult.create({
      data: {
        patientId: patient.id,
        branchId: patient.branchId,
        orderId: dto.orderId ?? null,
        orderItemId: dto.orderItemId ?? null,
        reportId: dto.reportId ?? null,
        resultNumber: clean(dto.resultNumber),
        category: dto.category,
        title: dto.title.trim(),
        resultDate: toDate(dto.resultDate),
        sampleDate: toDate(dto.sampleDate),
        performedByText: clean(dto.performedByText),
        externalProviderId: dto.externalProviderId ?? null,
        summaryText: clean(dto.summaryText),
        structuredValuesJson: dto.structuredValuesJson as Prisma.InputJsonValue | undefined,
        abnormalFlag: dto.abnormalFlag ?? false,
        criticalFlag: dto.criticalFlag ?? false,
        createdByUserId: user.id
      },
      include: includeResult
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "investigation_result.created",
      resourceType: "investigation_result",
      resourceId: result.id,
      branchId: result.branchId,
      severity: "high",
      metadataJson: { patientId: result.patientId, category: result.category, criticalFlag: result.criticalFlag, abnormalFlag: result.abnormalFlag }
    });

    return result;
  }

  async list(user: AuthUser) {
    return this.prisma.investigationResult.findMany({ where: branchScope(user), orderBy: { createdAt: "desc" }, take: 100, include: includeResult });
  }

  async listForPatient(patientId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    return this.prisma.investigationResult.findMany({ where: { patientId, ...branchScope(user) }, orderBy: { createdAt: "desc" }, include: includeResult });
  }

  async get(id: string, user: AuthUser) {
    const result = await this.prisma.investigationResult.findFirst({ where: { id, ...branchScope(user) }, include: includeResult });
    if (!result) throw new NotFoundException("Investigation result not found.");
    return result;
  }

  async update(id: string, dto: UpdateInvestigationResultDto, user: AuthUser) {
    const existing = await this.get(id, user);
    if (existing.reviewStatus === "reviewed") throw new BadRequestException("Reviewed results require amendment or void workflow.");
    const result = await this.prisma.investigationResult.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        summaryText: dto.summaryText === undefined ? undefined : clean(dto.summaryText),
        structuredValuesJson: dto.structuredValuesJson as Prisma.InputJsonValue | undefined,
        abnormalFlag: dto.abnormalFlag,
        criticalFlag: dto.criticalFlag,
        reviewStatus: dto.reviewStatus
      },
      include: includeResult
    });
    await this.audit.record({ actorUserId: user.id, action: "investigation_result.updated", resourceType: "investigation_result", resourceId: id, branchId: result.branchId, severity: "high", metadataJson: { changedFields: Object.keys(dto), fromStatus: existing.reviewStatus, toStatus: result.reviewStatus } });
    return result;
  }

  async review(id: string, dto: ReviewInvestigationResultDto, user: AuthUser) {
    const existing = await this.get(id, user);
    if (existing.reviewStatus === "voided") throw new BadRequestException("Voided results cannot be reviewed.");
    if (existing.criticalFlag && !existing.criticalAcknowledgedAt && !dto.acknowledgeCritical) {
      throw new BadRequestException("Critical result acknowledgement is required before review.");
    }
    const now = new Date();
    const reviewStatus: InvestigationResultReviewStatus = dto.reviewStatus ?? (dto.followUpNeeded ? "needs_follow_up" : "reviewed");
    const result = await this.prisma.investigationResult.update({
      where: { id },
      data: {
        reviewStatus,
        doctorComment: clean(dto.doctorComment),
        followUpNeeded: dto.followUpNeeded ?? false,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        reviewedByUserId: user.id,
        reviewedAt: now,
        criticalAcknowledgedAt: existing.criticalFlag && !existing.criticalAcknowledgedAt ? now : existing.criticalAcknowledgedAt,
        criticalAcknowledgedByUserId: existing.criticalFlag && !existing.criticalAcknowledgedByUserId ? user.id : existing.criticalAcknowledgedByUserId
      },
      include: includeResult
    });
    await this.audit.record({ actorUserId: user.id, action: "investigation_result.reviewed", resourceType: "investigation_result", resourceId: id, branchId: result.branchId, severity: "high", metadataJson: { patientId: result.patientId, fromStatus: existing.reviewStatus, toStatus: result.reviewStatus, followUpNeeded: result.followUpNeeded } });
    if (existing.criticalFlag && !existing.criticalAcknowledgedAt) {
      await this.audit.record({ actorUserId: user.id, action: "investigation_result.critical_acknowledged", resourceType: "investigation_result", resourceId: id, branchId: result.branchId, severity: "high", metadataJson: { patientId: result.patientId } });
    }
    return result;
  }

  async void(id: string, dto: VoidInvestigationResultDto, user: AuthUser) {
    if (!dto.reason?.trim()) throw new BadRequestException("Void reason is required.");
    const existing = await this.get(id, user);
    const result = await this.prisma.investigationResult.update({ where: { id }, data: { reviewStatus: "voided", voidReason: dto.reason.trim() }, include: includeResult });
    await this.audit.record({ actorUserId: user.id, action: "investigation_result.voided", resourceType: "investigation_result", resourceId: id, branchId: result.branchId, severity: "high", reason: dto.reason.trim(), metadataJson: { patientId: result.patientId, fromStatus: existing.reviewStatus } });
    return result;
  }
}

function clean(value?: string) {
  return value?.trim() || null;
}

function toDate(value?: string) {
  return value ? new Date(value) : null;
}
