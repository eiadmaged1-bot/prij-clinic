import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferencePatient } from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { ManualClinicalTagDto } from "./dto";

@Injectable()
export class ClinicalTagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async definitions(user: AuthUser) {
    this.assertClinicalSearchRole(user);
    return this.prisma.clinicalTagDefinition.findMany({ where: { active: true }, orderBy: [{ category: "asc" }, { label: "asc" }] });
  }

  async search(q: string | undefined, user: AuthUser) {
    this.assertClinicalSearchRole(user);
    const query = normalize(q ?? "");
    const definitions = await this.prisma.clinicalTagDefinition.findMany({ where: { active: true }, orderBy: { label: "asc" } });
    const matches = !query ? definitions : definitions.filter((tag) => {
      const aliases = Array.isArray(tag.aliasesJson) ? tag.aliasesJson.join(" ") : "";
      return normalize(`${tag.code} ${tag.label} ${aliases}`).includes(query);
    });
    await this.audit.record({ actorUserId: user.id, action: "clinical_tags.search", resourceType: "clinical_tag", branchId: user.branchId, severity: "medium", metadataJson: { queryPresent: Boolean(query), matchCount: matches.length } });
    return matches.slice(0, 50);
  }

  async patientsByTag(tag: string | undefined, user: AuthUser) {
    this.assertClinicalSearchRole(user);
    const query = normalize(tag ?? "");
    const definitions = await this.search(query, user);
    const codes = new Set(definitions.map((item) => item.code));
    if (query && codes.size === 0) codes.add(query);

    const tags = await this.prisma.patientClinicalTag.findMany({
      where: {
        ...(codes.size ? { tagCode: { in: [...codes] } } : {}),
        patient: { ...branchScope(user) }
      },
      include: {
        definition: true,
        patient: {
          include: {
            clinicalPhases: { where: { status: "active" }, orderBy: { startDate: "desc" }, take: 1 }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    await this.audit.record({ actorUserId: user.id, action: "clinical_tags.patient_search", resourceType: "patient_clinical_tag", branchId: user.branchId, severity: "medium", metadataJson: { queryPresent: Boolean(query), resultCount: tags.length } });

    return tags.map((tagRow) => ({
      id: tagRow.id,
      patientId: tagRow.patientId,
      patientName: `${tagRow.patient.firstName} ${tagRow.patient.lastName}`.trim(),
      medicalRecordNumber: tagRow.patient.medicalRecordNumber,
      phone: tagRow.patient.phone,
      patientType: tagRow.patient.patientType,
      currentPhase: tagRow.patient.clinicalPhases[0] ?? null,
      tagLabel: tagRow.label,
      tagCode: tagRow.tagCode,
      tagCategory: tagRow.category,
      sourceType: tagRow.sourceType,
      tagDate: tagRow.tagDate
    }));
  }

  async manualAdd(patientId: string, dto: ManualClinicalTagDto, user: AuthUser) {
    this.assertClinicalSearchRole(user);
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const definition = await this.findDefinition(dto.tagCode);
    const tag = await this.upsertPatientTag({
      patientId,
      tagCode: definition?.code ?? slug(dto.tagCode),
      label: dto.label?.trim() || definition?.label || dto.tagCode.trim(),
      category: dto.category?.trim() || definition?.category || "other",
      tagDefinitionId: definition?.id,
      sourceType: "manual",
      sourceId: "manual",
      tagDate: parseDate(dto.tagDate),
      notes: dto.notes?.trim() || null,
      createdByUserId: user.id
    });
    await this.audit.record({ actorUserId: user.id, action: "clinical_tag.manual_created", resourceType: "patient_clinical_tag", resourceId: tag.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId, tagCode: tag.tagCode, safety: "search_tag_only" } });
    return tag;
  }

  async createFromSource(input: { patientId: string; tagCode: string; label?: string; category?: string; sourceType: string; sourceId?: string | null; tagDate?: Date | null; notes?: string | null; createdByUserId?: string | null }) {
    const definition = await this.findDefinition(input.tagCode);
    return this.upsertPatientTag({
      patientId: input.patientId,
      tagDefinitionId: definition?.id,
      tagCode: definition?.code ?? slug(input.tagCode),
      label: input.label ?? definition?.label ?? input.tagCode,
      category: input.category ?? definition?.category ?? "other",
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? input.sourceType,
      tagDate: input.tagDate ?? null,
      notes: input.notes ?? null,
      createdByUserId: input.createdByUserId ?? null
    });
  }

  private async upsertPatientTag(input: Prisma.PatientClinicalTagUncheckedCreateInput) {
    const existing = await this.prisma.patientClinicalTag.findFirst({
      where: { patientId: input.patientId, tagCode: input.tagCode, sourceType: input.sourceType, sourceId: input.sourceId ?? null }
    });
    if (existing) {
      return this.prisma.patientClinicalTag.update({
        where: { id: existing.id },
        data: { label: input.label, category: input.category, tagDefinitionId: input.tagDefinitionId, tagDate: input.tagDate, notes: input.notes }
      });
    }
    return this.prisma.patientClinicalTag.create({ data: input });
  }

  private async findDefinition(codeOrAlias: string) {
    const code = slug(codeOrAlias);
    const direct = await this.prisma.clinicalTagDefinition.findUnique({ where: { code } });
    if (direct) return direct;
    const all = await this.prisma.clinicalTagDefinition.findMany({ where: { active: true } });
    return all.find((tag) => {
      const aliases = Array.isArray(tag.aliasesJson) ? tag.aliasesJson.join(" ") : "";
      return normalize(`${tag.code} ${tag.label} ${aliases}`).includes(normalize(codeOrAlias));
    }) ?? null;
  }

  private assertClinicalSearchRole(user: AuthUser) {
    if (!user.roles.some((role) => ["Owner", "Admin", "Doctor"].includes(role))) {
      throw new ForbiddenException("Clinical tag search is restricted to Owner, Admin, and Doctor roles.");
    }
  }
}

function normalize(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
}

function slug(value: string) {
  return normalize(value).replace(/\s+/g, "_");
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new BadRequestException("Invalid tag date.");
  return date;
}
