import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferencePatient, assertCanReferencePregnancy } from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { ObDatingCalculateDto } from "./dto/ob-dating-calculate.dto";
import { ChangeLockedDatingDto, SetBestDatingDto } from "./dto/set-best-dating.dto";
import { VoidCalculationDto } from "./dto/void-calculation.dto";
import { addDays, eddFromGaOnDate, gaDaysFromEdd, parseDateOnly, splitGa } from "./utils/date-gestational-age";

@Injectable()
export class ObDatingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async calculate(dto: ObDatingCalculateDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);
    const pregnancy = await this.resolvePregnancy(dto, user);
    const candidate = await this.calculateCandidate(dto) as any;

    if (candidate.unverifiedFormula) {
      return {
        ...candidate,
        formulaStatus: "draft",
        message: "Measurement recorded, but dating formula is not verified yet.",
        reviewRequired: true
      };
    }

    const assessment = await this.prisma.pregnancyDatingAssessment.create({
      data: {
        patientId: patient.id,
        pregnancyEpisodeId: pregnancy.id,
        datingSource: dto.datingSource,
        lmpDate: parseDateOnly(dto.lmpDate, "lmpDate"),
        cycleLengthDays: dto.cycleLengthDays ?? null,
        conceptionDate: parseDateOnly(dto.conceptionDate, "conceptionDate"),
        embryoTransferDate: parseDateOnly(dto.embryoTransferDate, "embryoTransferDate"),
        embryoAgeDays: dto.embryoAgeDays ?? null,
        scanDate: parseDateOnly(dto.scanDate, "scanDate"),
        gaWeeks: dto.gaWeeks ?? null,
        gaDays: dto.gaDays ?? null,
        knownEdd: parseDateOnly(dto.knownEdd, "knownEdd"),
        calculatedEdd: candidate.eddDate,
        calculatedGaAtAssessmentDays: candidate.gaAtAssessment.totalDays,
        discrepancyDays: candidate.discrepancyDays,
        confidenceStatus: candidate.confidenceStatus,
        calculationFormulaId: candidate.formulaId,
        inputJson: dto as never,
        outputJson: candidate.output as never,
        createdByUserId: user.id
      },
      include: datingIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "OB_DATING_ASSESSMENT_CREATED",
      resourceType: "pregnancy_dating_assessment",
      resourceId: patient.id,
      branchId: patient.branchId,
      severity: "high",
      metadataJson: { assessmentId: assessment.id, patientId: patient.id, pregnancyEpisodeId: pregnancy.id, datingSource: dto.datingSource, calculatedEdd: candidate.output.edd }
    });

    return assessment;
  }

  async listPatientDating(patientId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    return this.prisma.pregnancyDatingAssessment.findMany({
      where: { patientId, voidedAt: null, pregnancyEpisode: branchScope(user) },
      orderBy: { createdAt: "desc" },
      include: datingIncludes
    });
  }

  async currentPatientDating(patientId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    const best = await this.prisma.pregnancyDatingAssessment.findFirst({
      where: { patientId, isBestObstetricEstimate: true, voidedAt: null, pregnancyEpisode: { status: "active", ...branchScope(user) } },
      orderBy: { updatedAt: "desc" },
      include: datingIncludes
    });
    if (best) return decorateCurrent(best);

    const latest = await this.prisma.pregnancyDatingAssessment.findFirst({
      where: { patientId, voidedAt: null, pregnancyEpisode: { status: "active", ...branchScope(user) } },
      orderBy: { createdAt: "desc" },
      include: datingIncludes
    });
    return latest ? decorateCurrent(latest) : null;
  }

  async setBest(id: string, dto: SetBestDatingDto, user: AuthUser) {
    const assessment = await this.findAssessment(id, user);
    const lockedBest = await this.prisma.pregnancyDatingAssessment.findFirst({
      where: { pregnancyEpisodeId: assessment.pregnancyEpisodeId, isBestObstetricEstimate: true, isLocked: true, voidedAt: null }
    });
    if (lockedBest && lockedBest.id !== assessment.id) {
      throw new BadRequestException("A locked Best Obstetric EDD exists. Use the locked-change workflow with a reason.");
    }
    await this.prisma.pregnancyDatingAssessment.updateMany({
      where: { pregnancyEpisodeId: assessment.pregnancyEpisodeId, id: { not: assessment.id } },
      data: { isBestObstetricEstimate: false }
    });
    const updated = await this.prisma.pregnancyDatingAssessment.update({
      where: { id },
      data: { isBestObstetricEstimate: true, reviewedByUserId: user.id, reviewedAt: new Date(), changeReason: dto.reason?.trim() || null },
      include: datingIncludes
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "OB_BEST_EDD_SET",
      resourceType: "pregnancy_dating_assessment",
      resourceId: updated.patientId,
      branchId: updated.patient.branchId,
      severity: "high",
      reason: dto.reason?.trim() || null,
      metadataJson: { assessmentId: id, patientId: updated.patientId, pregnancyEpisodeId: updated.pregnancyEpisodeId, calculatedEdd: updated.calculatedEdd.toISOString().slice(0, 10) }
    });
    return updated;
  }

  async lock(id: string, dto: SetBestDatingDto, user: AuthUser) {
    const best = await this.setBest(id, dto, user);
    const locked = await this.prisma.pregnancyDatingAssessment.update({
      where: { id },
      data: { isLocked: true, lockedByUserId: user.id, lockedAt: new Date() },
      include: datingIncludes
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "CALCULATION_LOCKED",
      resourceType: "pregnancy_dating_assessment",
      resourceId: locked.patientId,
      branchId: best.patient.branchId,
      severity: "high",
      reason: dto.reason?.trim() || null,
      metadataJson: { assessmentId: id, patientId: locked.patientId, pregnancyEpisodeId: locked.pregnancyEpisodeId }
    });
    return locked;
  }

  async changeLocked(id: string, dto: ChangeLockedDatingDto, user: AuthUser) {
    const existing = await this.findAssessment(id, user);
    if (!existing.isLocked) {
      throw new BadRequestException("This dating assessment is not locked.");
    }
    const reason = dto.reason.trim();
    await this.prisma.pregnancyDatingAssessment.update({ where: { id }, data: { isBestObstetricEstimate: false } });
    const replacement = await this.prisma.pregnancyDatingAssessment.create({
      data: {
        patientId: existing.patientId,
        pregnancyEpisodeId: existing.pregnancyEpisodeId,
        datingSource: "MANUAL_DOCTOR",
        calculatedEdd: existing.calculatedEdd,
        calculatedGaAtAssessmentDays: existing.calculatedGaAtAssessmentDays,
        discrepancyDays: existing.discrepancyDays,
        confidenceStatus: "confirmed",
        isBestObstetricEstimate: true,
        isLocked: true,
        lockedByUserId: user.id,
        lockedAt: new Date(),
        changeReason: reason,
        calculationFormulaId: existing.calculationFormulaId,
        inputJson: { changedFromAssessmentId: existing.id, reason } as never,
        outputJson: existing.outputJson as never,
        createdByUserId: user.id,
        reviewedByUserId: user.id,
        reviewedAt: new Date()
      },
      include: datingIncludes
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "OB_LOCKED_EDD_CHANGED",
      resourceType: "pregnancy_dating_assessment",
      resourceId: replacement.patientId,
      branchId: (replacement as any).patient.branchId,
      severity: "high",
      reason,
      metadataJson: { assessmentId: replacement.id, patientId: replacement.patientId, previousAssessmentId: existing.id }
    });
    return replacement;
  }

  async void(id: string, dto: VoidCalculationDto, user: AuthUser) {
    const existing = await this.findAssessment(id, user);
    const voided = await this.prisma.pregnancyDatingAssessment.update({
      where: { id },
      data: { voidedAt: new Date(), voidReason: dto.reason.trim(), isBestObstetricEstimate: false },
      include: datingIncludes
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "OB_DATING_VOIDED",
      resourceType: "pregnancy_dating_assessment",
      resourceId: voided.patientId,
      branchId: voided.patient.branchId,
      severity: "high",
      reason: dto.reason.trim(),
      metadataJson: { assessmentId: id, patientId: existing.patientId, pregnancyEpisodeId: existing.pregnancyEpisodeId }
    });
    return voided;
  }

  private async resolvePregnancy(dto: ObDatingCalculateDto, user: AuthUser) {
    if (dto.pregnancyEpisodeId) {
      const pregnancy = await assertCanReferencePregnancy(this.prisma, dto.pregnancyEpisodeId, user, { patientId: dto.patientId });
      if (!pregnancy) throw new BadRequestException("Active pregnancy episode is required before saving OB dating.");
      return pregnancy;
    }
    const pregnancy = await this.prisma.pregnancy.findFirst({
      where: { patientId: dto.patientId, status: "active", ...branchScope(user) },
      orderBy: { createdAt: "desc" }
    });
    if (!pregnancy) throw new BadRequestException("Active pregnancy episode is required before saving OB dating.");
    return pregnancy;
  }

  private async calculateCandidate(dto: ObDatingCalculateDto) {
    if (dto.datingSource === "ULTRASOUND_BIOMETRY") {
      return { unverifiedFormula: true, output: { measurements: dto.measurements ?? {} } };
    }

    const formula = await this.formulaFor(dto);
    const assessmentDate = parseDateOnly(dto.assessmentDate ?? new Date().toISOString().slice(0, 10), "assessmentDate")!;
    let edd: Date;

    if (dto.datingSource === "LMP") edd = addDays(requiredDate(dto.lmpDate, "lmpDate"), 280);
    else if (dto.datingSource === "LMP_CYCLE_ADJUSTED") edd = addDays(requiredDate(dto.lmpDate, "lmpDate"), 280 + ((dto.cycleLengthDays ?? 28) - 28));
    else if (dto.datingSource === "CONCEPTION") edd = addDays(requiredDate(dto.conceptionDate, "conceptionDate"), 266);
    else if (dto.datingSource === "IVF") edd = addDays(requiredDate(dto.embryoTransferDate, "embryoTransferDate"), 266 - (dto.embryoAgeDays ?? 0));
    else if (dto.datingSource === "KNOWN_EDD" || dto.datingSource === "MANUAL_DOCTOR") edd = requiredDate(dto.knownEdd, "knownEdd");
    else if (dto.datingSource === "GA_ON_DATE") edd = eddFromGaOnDate(assessmentDate, requiredGa(dto.gaWeeks, "gaWeeks"), requiredGa(dto.gaDays, "gaDays"));
    else if (dto.datingSource === "ULTRASOUND_GA") edd = eddFromGaOnDate(requiredDate(dto.scanDate, "scanDate"), requiredGa(dto.gaWeeks, "gaWeeks"), requiredGa(dto.gaDays, "gaDays"));
    else throw new BadRequestException("Unsupported OB dating source.");

    const gaToday = splitGa(gaDaysFromEdd(edd, new Date()));
    const gaAtAssessment = splitGa(gaDaysFromEdd(edd, assessmentDate));
    return {
      eddDate: edd,
      formulaId: formula?.id ?? null,
      confidenceStatus: dto.datingSource === "ULTRASOUND_GA" || dto.datingSource === "KNOWN_EDD" ? "confirmed" : "needs_review",
      discrepancyDays: null,
      gaAtAssessment,
      output: {
        edd: edd.toISOString().slice(0, 10),
        gestationalAgeToday: gaToday,
        gestationalAgeAtAssessment: gaAtAssessment,
        datingSource: dto.datingSource,
        limitations: ["Dating candidate requires doctor review before it becomes the Best Obstetric EDD."],
        reviewRequired: true
      }
    };
  }

  private async formulaFor(dto: ObDatingCalculateDto) {
    const codeBySource: Record<string, string> = {
      LMP: "OB_EDD_FROM_LMP",
      LMP_CYCLE_ADJUSTED: "OB_EDD_FROM_LMP_CYCLE_LENGTH",
      CONCEPTION: "OB_EDD_FROM_CONCEPTION_DATE",
      IVF: "OB_EDD_FROM_CONCEPTION_DATE",
      KNOWN_EDD: "OB_EDD_FROM_KNOWN_EDD",
      MANUAL_DOCTOR: "OB_EDD_FROM_KNOWN_EDD",
      GA_ON_DATE: "OB_EDD_FROM_GA_ON_DATE",
      ULTRASOUND_GA: "OB_EDD_FROM_ULTRASOUND_GA_ON_DATE"
    };
    return this.prisma.calculatorFormula.findUnique({ where: { code: codeBySource[dto.datingSource] } });
  }

  private async findAssessment(id: string, user: AuthUser) {
    const assessment = await this.prisma.pregnancyDatingAssessment.findFirst({
      where: { id, pregnancyEpisode: branchScope(user) },
      include: datingIncludes
    });
    if (!assessment) throw new NotFoundException("Pregnancy dating assessment not found.");
    if (assessment.voidedAt) throw new BadRequestException("Pregnancy dating assessment is voided.");
    return assessment;
  }
}

const datingIncludes = {
  patient: true,
  pregnancyEpisode: true,
  calculationFormula: true,
  createdByUser: { select: { id: true, displayName: true } },
  reviewedByUser: { select: { id: true, displayName: true } },
  lockedByUser: { select: { id: true, displayName: true } }
};

function decorateCurrent(assessment: { calculatedEdd: Date; outputJson: unknown }) {
  const gaToday = splitGa(gaDaysFromEdd(assessment.calculatedEdd, new Date()));
  return { ...assessment, currentGestationalAge: gaToday };
}

function requiredDate(value: string | undefined, field: string) {
  const parsed = parseDateOnly(value, field);
  if (!parsed) throw new BadRequestException(`${field} is required.`);
  return parsed;
}

function requiredGa(value: number | undefined, field: string) {
  if (value === undefined || value === null) throw new BadRequestException(`${field} is required.`);
  return value;
}
