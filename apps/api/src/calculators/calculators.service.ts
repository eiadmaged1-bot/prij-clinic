import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferencePatient, assertCanReferencePregnancy } from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CalculateDto, ReviewCalculationDto } from "./dto/calculate.dto";
import { VoidCalculationDto } from "./dto/void-calculation.dto";
import { FormulaEngineService } from "./formula-engine.service";

@Injectable()
export class CalculatorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: FormulaEngineService,
    private readonly audit: AuditService
  ) {}

  async listFormulas() {
    const formulas = await this.prisma.calculatorFormula.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }]
    });
    return formulas.map(publicFormula);
  }

  async getFormula(code: string) {
    const formula = await this.prisma.calculatorFormula.findUnique({ where: { code } });
    if (!formula || !formula.active) {
      throw new NotFoundException("Formula not found.");
    }
    return publicFormula(formula);
  }

  async calculate(dto: CalculateDto, user: AuthUser) {
    const formula = await this.prisma.calculatorFormula.findUnique({ where: { code: dto.formulaCode } });
    if (!formula || !formula.active) {
      throw new NotFoundException("Formula not found.");
    }

    const patient = dto.patientId ? await assertCanReferencePatient(this.prisma, dto.patientId, user) : null;
    if (dto.pregnancyEpisodeId) {
      await assertCanReferencePregnancy(this.prisma, dto.pregnancyEpisodeId, user, { patientId: dto.patientId });
    }

    if (formula.implementationStatus !== "verified") {
      const output = {
        message: "Formula exists in catalog but is not verified for clinical use yet.",
        clinicalResultGenerated: false,
        measurementRecordingOnly: true
      };
      const response = resultEnvelope(formula, dto.input, output, {}, warnings(formula), user);
      if (dto.saveToHistory && dto.patientId) {
        response.history = await this.saveHistory({
          dto,
          user,
          formulaId: formula.id,
          output,
          units: {},
          status: "draft",
          branchId: patient?.branchId ?? null
        });
      }
      return response;
    }

    const calculated = this.engine.calculate(formula, dto.input);
    const response = resultEnvelope(formula, dto.input, calculated.output, calculated.units, calculated.limitations, user);
    if (dto.patientId || dto.saveToHistory) {
      if (!dto.patientId) {
        throw new BadRequestException("Patient-linked history requires patientId.");
      }
      response.history = await this.saveHistory({
        dto,
        user,
        formulaId: formula.id,
        output: calculated.output,
        units: calculated.units,
        status: "calculated",
        branchId: patient?.branchId ?? null
      });
    }

    return response;
  }

  async listHistory(user: AuthUser) {
    return this.prisma.patientCalculation.findMany({
      where: { patient: branchScope(user) },
      orderBy: { calculatedAt: "desc" },
      take: 100,
      include: historyIncludes
    });
  }

  async listPatientHistory(patientId: string, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const history = await this.prisma.patientCalculation.findMany({
      where: { patientId },
      orderBy: { calculatedAt: "desc" },
      take: 100,
      include: historyIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "calculation.history_read",
      resourceType: "patient",
      resourceId: patientId,
      branchId: patient.branchId,
      severity: "medium",
      metadataJson: { count: history.length }
    });

    return history;
  }

  async reviewCalculation(id: string, dto: ReviewCalculationDto, user: AuthUser) {
    const existing = await this.findCalculation(id, user);
    if (existing.status === "voided") throw new BadRequestException("Voided calculations cannot be reviewed.");
    const reviewed = await this.prisma.patientCalculation.update({
      where: { id },
      data: { status: "reviewed", reviewedByUserId: user.id, reviewedAt: new Date(), notes: dto.notes?.trim() || existing.notes },
      include: historyIncludes
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "CALCULATION_REVIEWED",
      resourceType: "patient_calculation",
      resourceId: reviewed.id,
      branchId: reviewed.patient?.branchId,
      severity: "high",
      metadataJson: { patientId: reviewed.patientId, formulaCode: reviewed.formula.code }
    });
    return reviewed;
  }

  async voidCalculation(id: string, dto: VoidCalculationDto, user: AuthUser) {
    const existing = await this.findCalculation(id, user);
    if (existing.status === "voided") return existing;
    const voided = await this.prisma.patientCalculation.update({
      where: { id },
      data: { status: "voided", voidReason: dto.reason.trim() },
      include: historyIncludes
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "CALCULATION_VOIDED",
      resourceType: "patient_calculation",
      resourceId: voided.id,
      branchId: voided.patient?.branchId,
      severity: "high",
      reason: dto.reason.trim(),
      metadataJson: { patientId: voided.patientId, formulaCode: voided.formula.code }
    });
    return voided;
  }

  async updateFormulaMetadata(code: string, dto: Record<string, unknown>, user: AuthUser) {
    const existing = await this.prisma.calculatorFormula.findUnique({ where: { code } });
    if (!existing) throw new NotFoundException("Formula not found.");
    const reason = String(dto.reason ?? "").trim();
    if (!reason) throw new BadRequestException("A reason is required.");
    const data = {
      active: typeof dto.active === "boolean" ? dto.active : existing.active,
      implementationStatus: typeof dto.implementationStatus === "string" ? dto.implementationStatus : existing.implementationStatus,
      sourceName: typeof dto.sourceName === "string" && dto.sourceName.trim() ? dto.sourceName.trim() : existing.sourceName,
      sourceYear: typeof dto.sourceYear === "number" ? dto.sourceYear : existing.sourceYear,
      sourceVersion: typeof dto.sourceVersion === "string" ? dto.sourceVersion.trim() : existing.sourceVersion,
      sourceUrl: typeof dto.sourceUrl === "string" ? dto.sourceUrl.trim() : existing.sourceUrl,
      limitationsJson: dto.limitationsJson && typeof dto.limitationsJson === "object" ? dto.limitationsJson : existing.limitationsJson
    };
    const updated = await this.prisma.calculatorFormula.update({ where: { code }, data: data as never });
    await this.audit.record({
      actorUserId: user.id,
      action: "calculator_formula.updated",
      resourceType: "calculator_formula",
      resourceId: updated.id,
      severity: "high",
      reason,
      metadataJson: { code, changedFields: Object.keys(dto).filter((key) => key !== "reason") }
    });
    return publicFormula(updated);
  }

  private async saveHistory(args: { dto: CalculateDto; user: AuthUser; formulaId: string; output: Record<string, unknown>; units: Record<string, string>; status: string; branchId?: string | null }) {
    const saved = await this.prisma.patientCalculation.create({
      data: {
        patientId: args.dto.patientId ?? null,
        pregnancyEpisodeId: args.dto.pregnancyEpisodeId ?? null,
        fetusId: args.dto.fetusId ?? null,
        formulaId: args.formulaId,
        calculationType: args.dto.formulaCode,
        inputJson: args.dto.input as never,
        outputJson: args.output as never,
        unitJson: args.units as never,
        calculatedAt: new Date(),
        calculatedByUserId: args.user.id,
        status: args.status,
        sourceContext: args.dto.sourceContext ?? "calculator_hub",
        notes: args.dto.notes?.trim() || null
      },
      include: historyIncludes
    });

    await this.audit.record({
      actorUserId: args.user.id,
      action: "CALCULATION_CREATED",
      resourceType: "patient_calculation",
      resourceId: saved.id,
      branchId: args.branchId ?? (saved as any).patient?.branchId,
      severity: "high",
      metadataJson: {
        patientId: saved.patientId,
        pregnancyEpisodeId: saved.pregnancyEpisodeId,
        formulaCode: (saved as any).formula.code,
        status: saved.status
      }
    });

    return saved;
  }

  private async findCalculation(id: string, user: AuthUser) {
    const calculation = await this.prisma.patientCalculation.findFirst({
      where: { id, patient: branchScope(user) },
      include: historyIncludes
    });
    if (!calculation) throw new NotFoundException("Calculation not found.");
    return calculation;
  }
}

const historyIncludes = {
  formula: true,
  patient: true,
  calculatedByUser: { select: { id: true, displayName: true } },
  reviewedByUser: { select: { id: true, displayName: true } }
};

function publicFormula(formula: { limitationsJson: unknown; [key: string]: unknown }) {
  return {
    ...formula,
    warnings: warnings(formula)
  };
}

function resultEnvelope(formula: { code: string; name: string; sourceName: string; sourceYear: number | null; sourceVersion: string | null; implementationStatus: string }, input: Record<string, unknown>, output: Record<string, unknown>, units: Record<string, string>, limitations: string[], user: AuthUser) {
  return {
    formula: {
      code: formula.code,
      name: formula.name,
      sourceName: formula.sourceName,
      sourceYear: formula.sourceYear,
      sourceVersion: formula.sourceVersion,
      implementationStatus: formula.implementationStatus
    },
    input,
    output,
    units,
    calculatedAt: new Date().toISOString(),
    calculatedBy: { id: user.id, displayName: user.displayName },
    limitations,
    reviewStatus: "unreviewed"
  } as Record<string, unknown>;
}

function warnings(formula: { limitationsJson: unknown }) {
  const value = formula.limitationsJson as { warnings?: string[] } | null;
  return value?.warnings?.length ? value.warnings : ["Clinical calculation support only; doctor review is required."];
}
