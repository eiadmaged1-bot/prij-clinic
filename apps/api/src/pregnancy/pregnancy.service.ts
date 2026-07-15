import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceEncounter, assertCanReferencePatient, assertCanReferencePregnancy } from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { ClinicalTagsService } from "../clinical-tags/clinical-tags.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateAntenatalVisitDto,
  CreateObUltrasoundDto,
  CreatePreviousPregnancyDto,
  CreatePregnancyDto,
  CreatePregnancyFetusDto,
  UpdateObUltrasoundDto,
  UpdatePregnancyDto
} from "./dto";

@Injectable()
export class PregnancyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly clinicalTags: ClinicalTagsService
  ) {}

  async createPregnancy(dto: CreatePregnancyDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);

    try {
      const pregnancy = await this.prisma.pregnancy.create({
        data: {
          patientId: dto.patientId,
          branchId: patient?.branchId,
          status: dto.status ?? "active",
          gravida: dto.gravida,
          para: dto.para,
          living: dto.living,
          abortions: dto.abortions,
          lmpDate: parseDate(dto.lmpDate, "lmpDate"),
          estimatedDueDate: parseDate(dto.estimatedDueDate, "estimatedDueDate"),
          datingMethod: clean(dto.datingMethod),
          riskLevel: clean(dto.riskLevel),
          riskFlags: clean(dto.riskFlags),
          notes: clean(dto.notes),
          createdByUserId: user.id
        },
        include: pregnancyIncludes
      });

      await this.audit.record({
        actorUserId: user.id,
        action: "pregnancy.created",
        resourceType: "pregnancy",
        resourceId: pregnancy.id,
        severity: "high",
        metadataJson: { patientId: pregnancy.patientId, status: pregnancy.status, safety: "recording_only" }
      });

      return pregnancy;
    } catch (error) {
      this.handlePrismaReferenceError(error);
    }
  }

  async listPregnancies(user: AuthUser) {
    const pregnancies = await this.prisma.pregnancy.findMany({
      where: branchScope(user),
      orderBy: { createdAt: "desc" },
      take: 100,
      include: pregnancyIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "pregnancy.list_read",
      resourceType: "pregnancy",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { count: pregnancies.length }
    });

    return pregnancies;
  }

  async getPregnancy(id: string, user: AuthUser) {
    const pregnancy = await this.prisma.pregnancy.findFirst({
      where: { id, ...branchScope(user) },
      include: pregnancyIncludes
    });

    if (!pregnancy) {
      throw new NotFoundException("Pregnancy record not found.");
    }

    await this.audit.record({
      actorUserId: user.id,
      action: "pregnancy.read",
      resourceType: "pregnancy",
      resourceId: pregnancy.id,
      branchId: pregnancy.branchId,
      severity: "medium",
      metadataJson: { status: pregnancy.status }
    });

    return pregnancy;
  }

  async updatePregnancy(id: string, dto: UpdatePregnancyDto, user: AuthUser) {
    const existing = await this.getPregnancy(id, user);
    const data: Prisma.PregnancyUpdateInput = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.gravida !== undefined) data.gravida = dto.gravida;
    if (dto.para !== undefined) data.para = dto.para;
    if (dto.living !== undefined) data.living = dto.living;
    if (dto.abortions !== undefined) data.abortions = dto.abortions;
    if (dto.lmpDate !== undefined) data.lmpDate = parseDate(dto.lmpDate, "lmpDate");
    if (dto.estimatedDueDate !== undefined) data.estimatedDueDate = parseDate(dto.estimatedDueDate, "estimatedDueDate");
    if (dto.datingMethod !== undefined) data.datingMethod = clean(dto.datingMethod);
    if (dto.riskLevel !== undefined) data.riskLevel = clean(dto.riskLevel);
    if (dto.riskFlags !== undefined) data.riskFlags = clean(dto.riskFlags);
    if (dto.notes !== undefined) data.notes = clean(dto.notes);

    const pregnancy = await this.prisma.pregnancy.update({
      where: { id },
      data,
      include: pregnancyIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "pregnancy.updated",
      resourceType: "pregnancy",
      resourceId: pregnancy.id,
      severity: "high",
      metadataJson: { changedFields: Object.keys(dto), fromStatus: existing.status, toStatus: pregnancy.status, safety: "recording_only" }
    });

    return pregnancy;
  }

  async createPreviousPregnancy(dto: CreatePreviousPregnancyDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);
    await assertCanReferencePregnancy(this.prisma, dto.pregnancyEpisodeId, user, { patientId: dto.patientId });

    const outcome = clean(dto.outcome);
    if (!outcome) {
      throw new BadRequestException("Outcome is required.");
    }

    const history = await this.prisma.previousPregnancy.create({
      data: {
        patientId: dto.patientId,
        pregnancyId: dto.pregnancyEpisodeId ?? null,
        year: dto.year,
        outcomeDate: parseDate(dto.outcomeDate, "outcomeDate"),
        outcome,
        outcomeType: clean(dto.outcomeType),
        gestationalAgeAtOutcome: clean(dto.gestationalAgeAtOutcome),
        modeOfDelivery: clean(dto.modeOfDelivery),
        babyOutcome: clean(dto.babyOutcome),
        livingChild: dto.livingChild ?? null,
        previousCesareanCount: dto.previousCesareanCount ?? null,
        cesareanIndication: clean(dto.cesareanIndication),
        cesareanComplications: clean(dto.cesareanComplications),
        birthWeightGrams: dto.birthWeightGrams,
        sex: clean(dto.sex),
        complications: clean(dto.complications),
        notes: clean(dto.notes),
        createdByUserId: user.id
      },
      include: previousPregnancyIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "previous_pregnancy.created",
      resourceType: "previous_pregnancy",
      resourceId: history.id,
      branchId: patient.branchId,
      severity: "high",
      metadataJson: { patientId: history.patientId, pregnancyId: history.pregnancyId, safety: "history_recording_only" }
    });

    for (const tagCode of previousPregnancyTagCodes(history)) {
      await this.clinicalTags.createFromSource({
        patientId: history.patientId,
        tagCode,
        sourceType: "previous_pregnancy",
        sourceId: history.id,
        tagDate: history.outcomeDate,
        createdByUserId: user.id
      });
    }

    return history;
  }

  async listPreviousPregnancies(user: AuthUser) {
    const histories = await this.prisma.previousPregnancy.findMany({
      where: { patient: branchScope(user) },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: previousPregnancyIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "previous_pregnancy.list_read",
      resourceType: "previous_pregnancy",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { count: histories.length }
    });

    return histories;
  }

  async createFetus(pregnancyId: string, dto: CreatePregnancyFetusDto, user: AuthUser) {
    const pregnancy = await this.getPregnancy(pregnancyId, user);
    const fetus = await this.prisma.pregnancyFetus.create({
      data: {
        pregnancyId,
        label: dto.label.trim(),
        chorionicity: clean(dto.chorionicity),
        amnionicity: clean(dto.amnionicity),
        status: clean(dto.status) ?? "active",
        notes: clean(dto.notes),
        createdByUserId: user.id
      }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "pregnancy_fetus.created",
      resourceType: "pregnancy_fetus",
      resourceId: fetus.id,
      branchId: pregnancy.branchId,
      severity: "high",
      metadataJson: { patientId: pregnancy.patientId, pregnancyId, label: fetus.label, safety: "multiple_pregnancy_recording_only" }
    });

    return fetus;
  }

  async listFetuses(pregnancyId: string, user: AuthUser) {
    await this.getPregnancy(pregnancyId, user);
    const fetuses = await this.prisma.pregnancyFetus.findMany({
      where: { pregnancyId },
      orderBy: { createdAt: "asc" }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "pregnancy_fetus.list_read",
      resourceType: "pregnancy_fetus",
      severity: "medium",
      metadataJson: { pregnancyId, count: fetuses.length }
    });

    return fetuses;
  }

  async updateFetus(pregnancyId: string, fetusId: string, dto: CreatePregnancyFetusDto, user: AuthUser) {
    const pregnancy = await this.getPregnancy(pregnancyId, user);
    const existing = await this.getFetusInPregnancy(pregnancyId, fetusId);
    const fetus = await this.prisma.pregnancyFetus.update({
      where: { id: existing.id },
      data: {
        label: dto.label.trim(),
        chorionicity: clean(dto.chorionicity),
        amnionicity: clean(dto.amnionicity),
        status: clean(dto.status) ?? existing.status,
        notes: clean(dto.notes)
      }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "pregnancy_fetus.updated",
      resourceType: "pregnancy_fetus",
      resourceId: fetus.id,
      branchId: pregnancy.branchId,
      severity: "high",
      metadataJson: { patientId: pregnancy.patientId, pregnancyId, changedFields: Object.keys(dto), safety: "recording_only" }
    });

    return fetus;
  }

  async createAntenatalVisit(pregnancyId: string, dto: CreateAntenatalVisitDto, user: AuthUser) {
    const pregnancy = await this.getPregnancy(pregnancyId, user);
    const visit = await this.prisma.antenatalVisit.create({
      data: {
        branchId: pregnancy.branchId,
        patientId: pregnancy.patientId,
        pregnancyId,
        visitDate: parseDate(dto.visitDate, "visitDate") ?? new Date(),
        gestationalAgeDisplay: clean(dto.gestationalAgeDisplay),
        bloodPressure: clean(dto.bloodPressure),
        weightKg: dto.weightKg !== undefined ? new Prisma.Decimal(dto.weightKg).toDecimalPlaces(2) : null,
        pulseBpm: dto.pulseBpm,
        edema: clean(dto.edema),
        urineProtein: clean(dto.urineProtein),
        symptomsText: clean(dto.symptomsText),
        examinationText: clean(dto.examinationText),
        fetalHeartText: clean(dto.fetalHeartText),
        fundalHeightText: clean(dto.fundalHeightText),
        planText: clean(dto.planText),
        medicationsNote: clean(dto.medicationsNote),
        investigationsNote: clean(dto.investigationsNote),
        nextFollowUpDate: parseDate(dto.nextFollowUpDate, "nextFollowUpDate"),
        createdByUserId: user.id
      }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "antenatal_visit.created",
      resourceType: "antenatal_visit",
      resourceId: visit.id,
      branchId: pregnancy.branchId,
      severity: "high",
      metadataJson: { patientId: pregnancy.patientId, pregnancyId, safety: "recording_only" }
    });

    return visit;
  }

  async listAntenatalVisits(pregnancyId: string, user: AuthUser) {
    await this.getPregnancy(pregnancyId, user);
    const visits = await this.prisma.antenatalVisit.findMany({
      where: { pregnancyId, ...branchScope(user) },
      orderBy: { visitDate: "desc" },
      take: 100
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "antenatal_visit.list_read",
      resourceType: "antenatal_visit",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { pregnancyId, count: visits.length }
    });

    return visits;
  }

  async createObUltrasound(dto: CreateObUltrasoundDto, user: AuthUser) {
    if (!dto.patientId || !dto.encounterId) {
      throw new BadRequestException("Patient and active visit context are required before saving an ultrasound report.");
    }
    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);
    const pregnancy = await assertCanReferencePregnancy(this.prisma, dto.pregnancyId, user, { patientId: dto.patientId });
    await this.assertCanReferenceFetus(dto.fetusId, pregnancy?.id, user);
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, {
      patientId: dto.patientId,
      requireDoctorScope: true
    });

    try {
      const performedAt = toDateTime(dto.performedAt);
      if (dto.performedAt !== undefined && !performedAt) {
        throw new BadRequestException("Invalid performedAt.");
      }

      const ultrasound = await this.prisma.obUltrasound.create({
        data: {
          patientId: dto.patientId,
          branchId: patient?.branchId,
          pregnancyId: dto.pregnancyId ?? null,
          fetusId: dto.fetusId ?? null,
          encounterId: dto.encounterId ?? null,
          performedAt: performedAt ?? new Date(),
          clinicalContext: dto.clinicalContext ?? "OB",
          cycleDay: dto.cycleDay,
          structuredFindingsJson: dto.structuredFindingsJson as Prisma.InputJsonValue | undefined,
          comparisonText: clean(dto.comparisonText),
          scanType: clean(dto.scanType),
          indication: clean(dto.indication),
          gestationalAgeDisplay: clean(dto.gestationalAgeDisplay),
          gestationalAgeWeeks: dto.gestationalAgeWeeks,
          gestationalAgeDays: dto.gestationalAgeDays,
          fetalHeartRateBpm: dto.fetalHeartRateBpm,
          fetalHeartText: clean(dto.fetalHeartText),
          presentation: clean(dto.presentation),
          placenta: clean(dto.placenta),
          amnioticFluid: clean(dto.amnioticFluid),
          bpdMm: decimalOrNull(dto.bpdMm),
          hcMm: decimalOrNull(dto.hcMm),
          acMm: decimalOrNull(dto.acMm),
          flMm: decimalOrNull(dto.flMm),
          efwGrams: dto.efwGrams,
          dopplerNote: clean(dto.dopplerNote),
          impressionText: clean(dto.impressionText),
          createdByUserId: user.id
        } as never,
        include: obUltrasoundIncludes
      });

      await this.audit.record({
        actorUserId: user.id,
        action: "ob_ultrasound.created",
        resourceType: "ob_ultrasound",
        resourceId: ultrasound.id,
        severity: "high",
        metadataJson: { patientId: ultrasound.patientId, pregnancyId: ultrasound.pregnancyId, fetusId: ultrasound.fetusId, safety: "recording_only_clinician_interpretation_required" }
      });

      return ultrasound;
    } catch (error) {
      this.handlePrismaReferenceError(error);
    }
  }

  async listObUltrasounds(user: AuthUser, query: Record<string, string | undefined> = {}) {
    const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
    const limit = Math.max(5, Math.min(50, Number.parseInt(query.limit ?? "20", 10) || 20));
    const status = query.status === "signed" ? "final" : query.status;
    const where = { ...branchScope(user), dataClassification: { notIn: ["TEST", "QUARANTINED"] }, ...(status && ["draft", "reviewed", "final", "voided"].includes(status) ? { status } : {}), ...(query.context ? { clinicalContext: query.context } : {}), ...(query.q ? { OR: [{ patient: { firstName: { contains: query.q, mode: "insensitive" } } }, { patient: { lastName: { contains: query.q, mode: "insensitive" } } }, { patient: { medicalRecordNumber: { contains: query.q, mode: "insensitive" } } }, { scanType: { contains: query.q, mode: "insensitive" } }] } : {}) } as unknown as Prisma.ObUltrasoundWhereInput;
    const [obUltrasounds, total] = await Promise.all([
      this.prisma.obUltrasound.findMany({ where, orderBy: { performedAt: "desc" }, skip: (page - 1) * limit, take: limit, include: obUltrasoundIncludes }),
      this.prisma.obUltrasound.count({ where })
    ]);

    await this.audit.record({
      actorUserId: user.id,
      action: "ob_ultrasound.list_read",
      resourceType: "ob_ultrasound",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { count: obUltrasounds.length }
    });

    return { items: obUltrasounds, pageInfo: { page, limit, total, hasMore: page * limit < total } };
  }

  async getObUltrasound(id: string, user: AuthUser) {
    const ultrasound = await this.prisma.obUltrasound.findFirst({
      where: { id, ...branchScope(user), dataClassification: { notIn: ["TEST", "QUARANTINED"] } } as unknown as Prisma.ObUltrasoundWhereInput,
      include: obUltrasoundIncludes
    });

    if (!ultrasound) {
      throw new NotFoundException("OB ultrasound record not found.");
    }

    await this.audit.record({
      actorUserId: user.id,
      action: "ob_ultrasound.read",
      resourceType: "ob_ultrasound",
      resourceId: ultrasound.id,
      branchId: ultrasound.branchId,
      severity: "medium",
      metadataJson: { status: ultrasound.status, pregnancyId: ultrasound.pregnancyId }
    });

    return ultrasound;
  }

  async updateObUltrasound(id: string, dto: UpdateObUltrasoundDto, user: AuthUser) {
    const existing = await this.getObUltrasound(id, user);
    if (!(dto.encounterId ?? existing.encounterId)) {
      throw new BadRequestException("Patient and active visit context are required before updating an ultrasound report.");
    }

    if (existing.status === "reviewed" && dto.status !== "voided") {
      throw new BadRequestException("Reviewed OB ultrasound records require a correction workflow before edits.");
    }

    await assertCanReferencePatient(this.prisma, existing.patientId, user);
    const pregnancy = await assertCanReferencePregnancy(this.prisma, dto.pregnancyId, user, { patientId: existing.patientId });
    await this.assertCanReferenceFetus(dto.fetusId, pregnancy?.id ?? existing.pregnancyId, user);
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, {
      patientId: existing.patientId,
      requireDoctorScope: true
    });

    const data: Prisma.ObUltrasoundUpdateInput = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.pregnancyId !== undefined) data.pregnancy = dto.pregnancyId ? { connect: { id: dto.pregnancyId } } : { disconnect: true };
    if (dto.fetusId !== undefined) data.fetus = dto.fetusId ? { connect: { id: dto.fetusId } } : { disconnect: true };
    if (dto.encounterId !== undefined) data.encounter = dto.encounterId ? { connect: { id: dto.encounterId } } : { disconnect: true };
    if (dto.performedAt !== undefined) {
      const performedAt = toDateTime(dto.performedAt);
      if (!performedAt) {
        throw new BadRequestException("Invalid performedAt.");
      }
      data.performedAt = performedAt;
    }
    if (dto.clinicalContext !== undefined) (data as Prisma.ObUltrasoundUpdateInput & { clinicalContext?: string }).clinicalContext = dto.clinicalContext;
    if (dto.cycleDay !== undefined) (data as Prisma.ObUltrasoundUpdateInput & { cycleDay?: number }).cycleDay = dto.cycleDay;
    if (dto.structuredFindingsJson !== undefined) (data as Prisma.ObUltrasoundUpdateInput & { structuredFindingsJson?: Prisma.InputJsonValue }).structuredFindingsJson = dto.structuredFindingsJson as Prisma.InputJsonValue;
    if (dto.comparisonText !== undefined) (data as Prisma.ObUltrasoundUpdateInput & { comparisonText?: string | null }).comparisonText = clean(dto.comparisonText);
    if (dto.amendmentReason !== undefined) {
      if (!dto.amendmentReason.trim()) throw new BadRequestException("An amendment reason is required.");
      (data as Prisma.ObUltrasoundUpdateInput & { amendmentReason?: string; amendmentVersion?: { increment: number } }).amendmentReason = dto.amendmentReason.trim();
      (data as Prisma.ObUltrasoundUpdateInput & { amendmentVersion?: { increment: number } }).amendmentVersion = { increment: 1 };
    }
    if (dto.scanType !== undefined) data.scanType = clean(dto.scanType);
    if (dto.indication !== undefined) data.indication = clean(dto.indication);
    if (dto.gestationalAgeDisplay !== undefined) data.gestationalAgeDisplay = clean(dto.gestationalAgeDisplay);
    if (dto.gestationalAgeWeeks !== undefined) data.gestationalAgeWeeks = dto.gestationalAgeWeeks;
    if (dto.gestationalAgeDays !== undefined) data.gestationalAgeDays = dto.gestationalAgeDays;
    if (dto.fetalHeartRateBpm !== undefined) data.fetalHeartRateBpm = dto.fetalHeartRateBpm;
    if (dto.fetalHeartText !== undefined) data.fetalHeartText = clean(dto.fetalHeartText);
    if (dto.presentation !== undefined) data.presentation = clean(dto.presentation);
    if (dto.placenta !== undefined) data.placenta = clean(dto.placenta);
    if (dto.amnioticFluid !== undefined) data.amnioticFluid = clean(dto.amnioticFluid);
    if (dto.bpdMm !== undefined) data.bpdMm = decimalOrNull(dto.bpdMm);
    if (dto.hcMm !== undefined) data.hcMm = decimalOrNull(dto.hcMm);
    if (dto.acMm !== undefined) data.acMm = decimalOrNull(dto.acMm);
    if (dto.flMm !== undefined) data.flMm = decimalOrNull(dto.flMm);
    if (dto.efwGrams !== undefined) data.efwGrams = dto.efwGrams;
    if (dto.dopplerNote !== undefined) data.dopplerNote = clean(dto.dopplerNote);
    if (dto.impressionText !== undefined) data.impressionText = clean(dto.impressionText);

    const ultrasound = await this.prisma.obUltrasound.update({
      where: { id },
      data,
      include: obUltrasoundIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "ob_ultrasound.updated",
      resourceType: "ob_ultrasound",
      resourceId: ultrasound.id,
      severity: "high",
      metadataJson: { changedFields: Object.keys(dto), fromStatus: existing.status, toStatus: ultrasound.status, safety: "recording_only_clinician_interpretation_required" }
    });

    return ultrasound;
  }

  async reviewObUltrasound(id: string, user: AuthUser) {
    const existing = await this.getObUltrasound(id, user);
    if (existing.status === "voided") {
      throw new BadRequestException("Voided OB ultrasound records cannot be reviewed.");
    }
    if (!hasMeaningfulUltrasoundContent(existing)) throw new BadRequestException("A scan type and meaningful structured measurement, finding, or impression are required before review.");

    const ultrasound = await this.prisma.obUltrasound.update({
      where: { id },
      data: { status: "reviewed", reviewedAt: new Date(), reviewedByUserId: user.id },
      include: obUltrasoundIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "ob_ultrasound.reviewed",
      resourceType: "ob_ultrasound",
      resourceId: ultrasound.id,
      severity: "high",
      metadataJson: { patientId: ultrasound.patientId, fromStatus: existing.status }
    });

    return ultrasound;
  }

  private handlePrismaReferenceError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new BadRequestException("Referenced patient, pregnancy, encounter, or user was not found.");
    }
    throw error;
  }

  private async assertCanReferenceFetus(fetusId: string | undefined, pregnancyId: string | null | undefined, user: AuthUser) {
    if (!fetusId) return null;
    if (!pregnancyId) {
      throw new BadRequestException("A fetus record must be linked to a pregnancy episode.");
    }

    await this.getPregnancy(pregnancyId, user);
    const fetus = await this.getFetusInPregnancy(pregnancyId, fetusId);
    return fetus;
  }

  private async getFetusInPregnancy(pregnancyId: string, fetusId: string) {
    const fetus = await this.prisma.pregnancyFetus.findFirst({
      where: { id: fetusId, pregnancyId }
    });

    if (!fetus) {
      throw new NotFoundException("Fetus record not found.");
    }

    return fetus;
  }
}

const pregnancyIncludes = {
  patient: true,
  fetuses: true,
  previousPregnancies: true,
  antenatalVisits: true,
  obUltrasounds: true
} satisfies Prisma.PregnancyInclude;

const previousPregnancyIncludes = {
  patient: true,
  pregnancy: true
} satisfies Prisma.PreviousPregnancyInclude;

const obUltrasoundIncludes = {
  patient: true,
  pregnancy: true,
  fetus: true,
  encounter: true
} satisfies Prisma.ObUltrasoundInclude;

function clean(value?: string) {
  return value?.trim() || null;
}

function parseDate(value: string | undefined, fieldName: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Invalid ${fieldName}.`);
  }
  return date;
}

function toDateTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function decimalOrNull(value: number | undefined) {
  return value === undefined ? null : new Prisma.Decimal(value).toDecimalPlaces(2);
}

function hasMeaningfulUltrasoundContent(scan: { scanType: string | null; impressionText: string | null; fetalHeartRateBpm: number | null; bpdMm: Prisma.Decimal | null; hcMm: Prisma.Decimal | null; acMm: Prisma.Decimal | null; flMm: Prisma.Decimal | null } & { structuredFindingsJson?: unknown }) {
  return Boolean(scan.scanType?.trim() && (scan.impressionText?.trim() || scan.fetalHeartRateBpm || scan.bpdMm || scan.hcMm || scan.acMm || scan.flMm || (scan.structuredFindingsJson && Object.keys(scan.structuredFindingsJson as object).length)));
}

function previousPregnancyTagCodes(history: { outcome: string; outcomeType?: string | null; modeOfDelivery?: string | null }) {
  const text = `${history.outcome} ${history.outcomeType ?? ""} ${history.modeOfDelivery ?? ""}`.toLowerCase();
  const tags = new Set<string>();
  if (/cesarean|caesarean|\bcs\b|c-section/.test(text)) tags.add("previous_cesarean_section");
  if (/normal vaginal|nvd|vaginal delivery/.test(text)) tags.add("normal_vaginal_delivery");
  if (/instrumental|forceps|vacuum/.test(text)) tags.add("instrumental_delivery");
  if (/miscarriage|abortion/.test(text)) tags.add("miscarriage_abortion");
  if (/ectopic/.test(text)) tags.add("ectopic_pregnancy");
  if (/molar/.test(text)) tags.add("molar_pregnancy");
  if (/stillbirth|iufd/.test(text)) tags.add("iufd_stillbirth");
  return [...tags];
}
