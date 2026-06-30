import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceEncounter, assertCanReferencePatient, assertCanReferencePregnancy } from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CloseReferralDto, CreateReferralDto, UpdateReferralDto } from "./dto";

const includeReferral = { patient: true } satisfies Prisma.ReferralInclude;

@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(user: AuthUser) {
    return this.prisma.referral.findMany({ where: branchScope(user), orderBy: { createdAt: "desc" }, take: 100, include: includeReferral });
  }

  async listForPatient(patientId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    return this.prisma.referral.findMany({ where: { patientId, ...branchScope(user) }, orderBy: { createdAt: "desc" }, include: includeReferral });
  }

  async create(dto: CreateReferralDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, { patientId: dto.patientId, requireDoctorScope: true });
    await assertCanReferencePregnancy(this.prisma, dto.pregnancyId, user, { patientId: dto.patientId });
    const referral = await this.prisma.referral.create({
      data: {
        patientId: dto.patientId,
        branchId: patient.branchId,
        encounterId: dto.encounterId ?? null,
        pregnancyId: dto.pregnancyId ?? null,
        referredByUserId: user.id,
        referralDirection: dto.referralDirection ?? "outbound",
        referralType: dto.referralType,
        referredToProviderId: dto.referredToProviderId ?? null,
        referredToText: clean(dto.referredToText),
        reason: dto.reason.trim(),
        clinicalSummary: clean(dto.clinicalSummary),
        urgency: dto.urgency ?? "routine"
      },
      include: includeReferral
    });
    await this.audit.record({ actorUserId: user.id, action: "referral.created", resourceType: "referral", resourceId: referral.id, branchId: referral.branchId, severity: "high", metadataJson: { patientId: referral.patientId, referralType: referral.referralType, urgency: referral.urgency } });
    return referral;
  }

  async get(id: string, user: AuthUser) {
    const referral = await this.prisma.referral.findFirst({ where: { id, ...branchScope(user) }, include: includeReferral });
    if (!referral) throw new NotFoundException("Referral not found.");
    return referral;
  }

  async update(id: string, dto: UpdateReferralDto, user: AuthUser) {
    const existing = await this.get(id, user);
    const referral = await this.prisma.referral.update({ where: { id }, data: { status: dto.status, reason: dto.reason?.trim(), clinicalSummary: dto.clinicalSummary === undefined ? undefined : clean(dto.clinicalSummary), sentAt: dto.sentAt ? new Date(dto.sentAt) : undefined }, include: includeReferral });
    await this.audit.record({ actorUserId: user.id, action: "referral.updated", resourceType: "referral", resourceId: id, branchId: referral.branchId, severity: "high", metadataJson: { changedFields: Object.keys(dto), fromStatus: existing.status, toStatus: referral.status } });
    return referral;
  }

  async close(id: string, dto: CloseReferralDto, user: AuthUser) {
    if (!dto.closureNote?.trim()) throw new BadRequestException("Referral close note is required.");
    const existing = await this.get(id, user);
    const referral = await this.prisma.referral.update({ where: { id }, data: { status: "closed", closedAt: new Date(), closureNote: dto.closureNote.trim() }, include: includeReferral });
    await this.audit.record({ actorUserId: user.id, action: "referral.closed", resourceType: "referral", resourceId: id, branchId: referral.branchId, severity: "high", reason: dto.closureNote.trim(), metadataJson: { patientId: referral.patientId, fromStatus: existing.status } });
    return referral;
  }
}

function clean(value?: string) {
  return value?.trim() || null;
}
