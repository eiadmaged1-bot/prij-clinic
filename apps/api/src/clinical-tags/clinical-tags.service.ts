import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferencePatient } from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { ManualClinicalTagDto, UpdateClinicalTagDto } from "./dto";

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
    const terms = splitTerms(tag ?? "");
    const patients = await this.prisma.patient.findMany({
      where: { ...branchScope(user) },
      include: {
        clinicalTags: { include: { definition: true }, orderBy: { createdAt: "desc" } },
        medicationHistoryItems: { include: { medicationGeneric: true }, orderBy: { createdAt: "desc" } },
        clinicalPhases: { where: { status: "active" }, orderBy: { startDate: "desc" }, take: 1 },
        encounters: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: 500
    });
    const matched = patients.flatMap((patient) => {
      const tagMatches = patient.clinicalTags.map((row) => ({ row, text: tagSearchText(row) }));
      const medicationMatches = patient.medicationHistoryItems.map((row) => ({ row, text: medicationSearchText(row) }));
      const matchesEveryTerm = terms.every((term) => tagMatches.some((item) => item.text.includes(term)) || medicationMatches.some((item) => item.text.includes(term)));
      if (!matchesEveryTerm) return [];
      const matchingTags = tagMatches.filter((item) => !terms.length || terms.some((term) => item.text.includes(term))).map((item) => item.row);
      const matchingMedications = medicationMatches.filter((item) => terms.some((term) => item.text.includes(term))).map((item) => item.row);
      const primary = matchingTags[0] ?? patient.clinicalTags[0];
      return [{
        id: primary?.id ?? patient.id,
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`.trim(),
        medicalRecordNumber: patient.medicalRecordNumber,
        phone: patient.phone,
        patientType: patient.patientType,
        currentPhase: patient.clinicalPhases[0] ?? null,
        tagLabel: primary?.label ?? matchingMedications[0]?.genericNameSnapshot ?? "Medication history",
        tagCode: primary?.tagCode ?? "medication_history",
        tagCategory: primary?.category ?? "medication_history",
        sourceType: primary?.sourceType ?? "medication_history",
        tagDate: primary?.tagDate ?? null,
        historyStatus: primary?.historyStatus ?? matchingMedications[0]?.currentOrPast ?? null,
        matchingTags: matchingTags.map((row) => ({ code: row.tagCode, label: row.label, date: row.tagDate, status: row.historyStatus })),
        matchingMedications: matchingMedications.map((row) => ({ genericName: row.genericNameSnapshot, familyName: row.familyNameSnapshot, clinicalGroup: row.clinicalGroupSnapshot, status: row.currentOrPast })),
        lastVisit: patient.encounters[0]?.createdAt ?? null
      }];
    }).slice(0, 100);

    await this.audit.record({ actorUserId: user.id, action: "clinical_tags.patient_search", resourceType: "patient_clinical_tag", branchId: user.branchId, severity: "medium", metadataJson: { termCount: terms.length, resultCount: matched.length } });
    return matched;
  }

  async forPatient(patientId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    return this.prisma.patientClinicalTag.findMany({ where: { patientId }, include: { definition: true }, orderBy: [{ category: "asc" }, { createdAt: "desc" }] });
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
      historyStatus: dto.historyStatus ?? "current",
      tagDate: parseDate(dto.tagDate),
      tagYear: dto.tagYear ?? null,
      detailJson: dto.detailJson as Prisma.InputJsonValue | undefined,
      manualNote: dto.manualNote?.trim() || null,
      notes: dto.notes?.trim() || null,
      createdByUserId: user.id
    });
    await this.audit.record({ actorUserId: user.id, action: "clinical_tag.manual_created", resourceType: "patient_clinical_tag", resourceId: tag.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId, tagCode: tag.tagCode, safety: "search_tag_only" } });
    return tag;
  }

  async update(patientId: string, tagId: string, dto: UpdateClinicalTagDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const existing = await this.prisma.patientClinicalTag.findFirst({ where: { id: tagId, patientId } });
    if (!existing) throw new BadRequestException("Clinical history tag was not found.");
    const updated = await this.prisma.patientClinicalTag.update({ where: { id: tagId }, data: { historyStatus: dto.historyStatus, tagDate: dto.tagDate ? parseDate(dto.tagDate) : undefined, tagYear: dto.tagYear, detailJson: dto.detailJson as Prisma.InputJsonValue | undefined, manualNote: dto.manualNote?.trim() } });
    await this.audit.record({ actorUserId: user.id, action: "clinical_tag.updated", resourceType: "patient_clinical_tag", resourceId: tagId, branchId: patient.branchId, severity: "high", metadataJson: { patientId, changedFields: Object.keys(dto) } });
    return updated;
  }

  async remove(patientId: string, tagId: string, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const existing = await this.prisma.patientClinicalTag.findFirst({ where: { id: tagId, patientId } });
    if (!existing) throw new BadRequestException("Clinical history tag was not found.");
    await this.prisma.patientClinicalTag.delete({ where: { id: tagId } });
    await this.audit.record({ actorUserId: user.id, action: "clinical_tag.removed", resourceType: "patient_clinical_tag", resourceId: tagId, branchId: patient.branchId, severity: "high", reason: "Clinician removed structured history tag", metadataJson: { patientId, tagCode: existing.tagCode } });
    return { removed: true };
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

function splitTerms(value: string) {
  return value.split(/\s*(?:\+|,)\s*/).map(normalize).filter(Boolean).slice(0, 8);
}

function tagSearchText(row: { tagCode: string; label: string; category: string; definition?: { aliasesJson: Prisma.JsonValue } | null }) {
  const aliases = Array.isArray(row.definition?.aliasesJson) ? row.definition.aliasesJson.join(" ") : "";
  return normalize(`${row.tagCode} ${row.label} ${row.category} ${aliases}`);
}

function medicationSearchText(row: { genericNameSnapshot: string; familyNameSnapshot: string | null; clinicalGroupSnapshot: string | null; indication: string | null; medicationGeneric?: { className: string | null; familyName: string | null; pharmacologicClass: string | null; aliases: Prisma.JsonValue } | null }) {
  const aliases = Array.isArray(row.medicationGeneric?.aliases) ? row.medicationGeneric.aliases.join(" ") : "";
  return normalize(`${row.genericNameSnapshot} ${row.familyNameSnapshot ?? ""} ${row.clinicalGroupSnapshot ?? ""} ${row.indication ?? ""} ${row.medicationGeneric?.className ?? ""} ${row.medicationGeneric?.familyName ?? ""} ${row.medicationGeneric?.pharmacologicClass ?? ""} ${aliases}`);
}
