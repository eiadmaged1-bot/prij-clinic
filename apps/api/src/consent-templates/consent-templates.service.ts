import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CreateConsentTemplateDto, ReviewConsentRecordDto, SignConsentDemoDto, UpdateConsentTemplateDto } from "./dto";

@Injectable()
export class ConsentTemplatesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  list() {
    return this.prisma.consentTemplate.findMany({ orderBy: [{ active: "desc" }, { title: "asc" }], take: 100 });
  }

  async create(dto: CreateConsentTemplateDto, user: AuthUser) {
    const template = await this.prisma.consentTemplate.create({
      data: {
        code: dto.code.trim(),
        title: dto.title.trim(),
        category: dto.category,
        language: dto.language ?? "en",
        versionLabel: dto.versionLabel.trim(),
        bodyText: dto.bodyText.trim(),
        fieldsJson: dto.fieldsJson as Prisma.InputJsonValue | undefined,
        requiresWitness: dto.requiresWitness ?? false,
        requiresGuardian: dto.requiresGuardian ?? false,
        active: dto.active ?? true
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "consent_template.created", resourceType: "consent_template", resourceId: template.id, severity: "high", metadataJson: { code: template.code, category: template.category } });
    return template;
  }

  async update(id: string, dto: UpdateConsentTemplateDto, user: AuthUser) {
    const existing = await this.prisma.consentTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Consent template not found.");
    const template = await this.prisma.consentTemplate.update({ where: { id }, data: { title: dto.title?.trim(), bodyText: dto.bodyText?.trim(), active: dto.active } });
    await this.audit.record({ actorUserId: user.id, action: "consent_template.updated", resourceType: "consent_template", resourceId: template.id, severity: "high", metadataJson: { changedFields: Object.keys(dto), code: template.code } });
    return template;
  }

  async signDemo(consentId: string, dto: SignConsentDemoDto, user: AuthUser) {
    const consent = await this.findConsent(consentId, user);
    if (!dto.signedByName?.trim()) throw new BadRequestException("Demo signer name is required.");
    const updated = await this.prisma.consentRecord.update({
      where: { id: consent.id },
      data: {
        signedByName: dto.signedByName.trim(),
        relationshipToPatient: clean(dto.relationshipToPatient),
        guardianName: clean(dto.guardianName),
        witnessName: clean(dto.witnessName),
        legalNotes: clean(dto.legalNotes),
        signatureStatus: "captured_demo",
        signedAt: new Date()
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "consent_record.signed_demo", resourceType: "consent_record", resourceId: updated.id, severity: "high", metadataJson: { patientId: updated.patientId, signatureStatus: updated.signatureStatus, demoOnly: true } });
    return updated;
  }

  async review(consentId: string, dto: ReviewConsentRecordDto, user: AuthUser) {
    const consent = await this.findConsent(consentId, user);
    const updated = await this.prisma.consentRecord.update({ where: { id: consent.id }, data: { reviewedByUserId: user.id, reviewedAt: new Date(), legalNotes: dto.legalNotes === undefined ? consent.legalNotes : clean(dto.legalNotes) } });
    await this.audit.record({ actorUserId: user.id, action: "consent_record.reviewed", resourceType: "consent_record", resourceId: updated.id, severity: "high", metadataJson: { patientId: updated.patientId, consentType: updated.consentType } });
    return updated;
  }

  private async findConsent(consentId: string, user: AuthUser) {
    const consent = await this.prisma.consentRecord.findFirst({ where: { id: consentId, patient: branchScope(user) } });
    if (!consent) throw new NotFoundException("Consent record not found.");
    return consent;
  }
}

function clean(value?: string) {
  return value?.trim() || null;
}
