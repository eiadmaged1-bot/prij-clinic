import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { SearchMedicationSafetyProfilesDto } from "./dto/search-medication-safety-profiles.dto";

const forbiddenProfileFields = new Set(["dose", "dosage", "frequency", "duration", "instructions", "price", "stock", "tradeName", "brandName", "pharmacy", "inventory"]);
const allowedImportFields = new Set([
  "genericName",
  "legacyPregnancyCategory",
  "pregnancyRiskSummary",
  "pregnancyClinicalConsiderations",
  "pregnancyDataSummary",
  "lactationRiskLevel",
  "lactationRiskSummary",
  "lactationMilkTransferSummary",
  "lactationInfantEffectsSummary",
  "lactationClinicalConsiderations",
  "reproductivePotentialNotes",
  "sourceName",
  "sourceUrl",
  "sourceYear",
  "sourceType",
  "confidenceLevel",
  "reviewStatus"
]);
const allowedLegacyCategories = new Set(["A", "B", "C", "D", "X", "N", "UNKNOWN", "REVIEW_REQUIRED"]);
const allowedLactationLevels = new Set(["COMPATIBLE", "CAUTION", "AVOID", "INSUFFICIENT_DATA", "UNKNOWN", "REVIEW_REQUIRED"]);
const allowedSourceTypes = new Set(["official_label", "curated_reference", "guideline", "licensed_database", "manual_review", "not_reviewed"]);
const allowedConfidenceLevels = new Set(["high", "moderate", "low", "unknown"]);
const allowedInputReviewStatuses = new Set(["reviewed", "needs_review", "imported", "rejected", "retired"]);

type ImportPreviewRow = {
  rowNumber: number;
  genericName: string;
  medicationGenericId?: string;
  legacyPregnancyCategory: string;
  lactationRiskLevel: string;
  sourceName: string;
  sourceYear: number | null;
  sourceType: string;
  confidenceLevel: string;
  reviewStatus: "needs_review";
  warnings: string[];
  input: Record<string, unknown>;
};

@Injectable()
export class MedicationPregnancyLactationSafetyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async getProfile(medicationGenericId: string) {
    const generic = await this.prisma.medicationGeneric.findUnique({
      where: { id: medicationGenericId },
      include: { safetyProfile: { include: { reviewedByUser: { select: { id: true, displayName: true, email: true } } } } }
    });
    if (!generic) throw new NotFoundException("Generic medication not found.");
    return {
      medication: {
        id: generic.id,
        genericName: generic.genericName,
        familyName: generic.familyName,
        className: generic.className,
        pharmacologicClass: generic.pharmacologicClass
      },
      profile: generic.safetyProfile,
      warning: "Reference only. Doctor review required."
    };
  }

  async search(dto: SearchMedicationSafetyProfilesDto) {
    const q = dto.q?.trim();
    const rows = await this.prisma.medicationSafetyProfile.findMany({
      where: {
        ...(dto.legacyPregnancyCategory ? { legacyPregnancyCategory: dto.legacyPregnancyCategory as never } : {}),
        ...(dto.lactationRiskLevel ? { lactationRiskLevel: dto.lactationRiskLevel as never } : {}),
        ...(dto.reviewStatus ? { reviewStatus: dto.reviewStatus as never } : {}),
        ...(q
          ? {
              medicationGeneric: {
                OR: [
                  { genericName: { contains: q, mode: "insensitive" } },
                  { familyName: { contains: q, mode: "insensitive" } },
                  { className: { contains: q, mode: "insensitive" } },
                  { pharmacologicClass: { contains: q, mode: "insensitive" } }
                ]
              }
            }
          : {})
      },
      include: { medicationGeneric: true },
      orderBy: [{ reviewStatus: "asc" }, { legacyPregnancyCategory: "asc" }],
      take: 100
    });
    return rows.map((row) => ({
      ...row,
      warning: "Reference only. Doctor review required."
    }));
  }

  async previewImport(dto: Record<string, unknown>) {
    const parsed = parseImportRows(dto);
    const accepted: ImportPreviewRow[] = [];
    const rejected: Array<{ rowNumber: number; genericName?: string; errors: string[]; warnings: string[] }> = [];

    for (const [index, row] of parsed.entries()) {
      const result = await this.validateImportRow(row, index + 2);
      if ("errors" in result) rejected.push(result);
      else accepted.push(result);
    }

    return {
      summary: { rows: parsed.length, accepted: accepted.length, rejected: rejected.length, warnings: accepted.reduce((count, row) => count + row.warnings.length, 0) + rejected.reduce((count, row) => count + row.warnings.length, 0) },
      accepted,
      rejected,
      warning: "Preview only. No profile changes were written."
    };
  }

  async commitImport(dto: Record<string, unknown>, user: AuthUser) {
    const preview = await this.previewImport(dto);
    if (!preview.accepted.length) throw new BadRequestException("No valid medication safety source rows to import.");
    const jobId = randomUUID();
    let createdOrUpdated = 0;

    for (const row of preview.accepted) {
      const categoryInput = String(row.input.legacyPregnancyCategory ?? "REVIEW_REQUIRED").trim().toUpperCase();
      await this.prisma.medicationSafetyProfile.upsert({
        where: { medicationGenericId: row.medicationGenericId! },
        update: importRowData(row, categoryInput),
        create: { medicationGenericId: row.medicationGenericId!, ...importRowData(row, categoryInput) }
      });
      createdOrUpdated += 1;
    }

    await this.audit.record({
      actorUserId: user.id,
      action: "medication_safety_profile.import_committed",
      resourceType: "medication_safety_import_job",
      resourceId: jobId,
      severity: "high",
      metadataJson: {
        fileName: clean(dto.fileName),
        accepted: preview.summary.accepted,
        rejected: preview.summary.rejected,
        warnings: preview.summary.warnings,
        createdOrUpdated,
        finalReviewStatus: "needs_review"
      }
    });

    return { jobId, createdOrUpdated, preview, reviewStatus: "needs_review" };
  }

  async importJobs() {
    const rows = await this.prisma.auditLog.findMany({
      where: { resourceType: "medication_safety_import_job" },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { id: true, resourceId: true, actorUserId: true, action: true, metadataJson: true, createdAt: true }
    });
    return rows;
  }

  async reviewQueue() {
    return this.prisma.medicationSafetyProfile.findMany({
      where: { reviewStatus: "needs_review" },
      include: { medicationGeneric: true, reviewedByUser: { select: { id: true, displayName: true, email: true } } },
      orderBy: [{ updatedAt: "desc" }],
      take: 100
    });
  }

  async decideReview(profileId: string, dto: Record<string, unknown>, user: AuthUser) {
    const decision = String(dto.decision ?? "").trim().toLowerCase();
    const reason = clean(dto.reason);
    if (!["approve", "reject", "retire"].includes(decision)) throw new BadRequestException("Review decision must be approve, reject, or retire.");
    if (!reason) throw new BadRequestException("Review decision requires a reason.");

    const existing = await this.prisma.medicationSafetyProfile.findUnique({ where: { id: profileId } });
    if (!existing) throw new NotFoundException("Medication safety profile not found.");
    if (decision === "approve" && (!existing.sourceName || existing.sourceName === "Not reviewed" || existing.sourceType === "not_reviewed")) {
      throw new BadRequestException("Approval requires source metadata.");
    }

    const nextStatus = decision === "approve" ? "reviewed" : decision === "reject" ? "rejected" : "retired";
    const profile = await this.prisma.medicationSafetyProfile.update({
      where: { id: profileId },
      data: {
        reviewStatus: nextStatus as never,
        reviewedByUserId: decision === "approve" ? user.id : null,
        reviewedAt: decision === "approve" ? new Date() : null,
        sourceRefreshStatus: decision === "approve" ? existing.sourceRefreshStatus ?? "UNKNOWN" : "REVIEW_REQUIRED",
        sourceRefreshNote: reason
      },
      include: { medicationGeneric: true, reviewedByUser: { select: { id: true, displayName: true, email: true } } }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: `medication_safety_profile.${decision}`,
      resourceType: "medication_safety_profile",
      resourceId: profile.id,
      severity: "high",
      reason,
      metadataJson: { fromStatus: existing.reviewStatus, toStatus: profile.reviewStatus, medicationGenericId: profile.medicationGenericId }
    });

    return profile;
  }

  async updateProfile(medicationGenericId: string, dto: Record<string, unknown>, user: AuthUser) {
    for (const key of Object.keys(dto)) {
      if (forbiddenProfileFields.has(key)) throw new BadRequestException(`Forbidden medication safety profile field: ${key}`);
    }
    const generic = await this.prisma.medicationGeneric.findUnique({ where: { id: medicationGenericId }, select: { id: true } });
    if (!generic) throw new NotFoundException("Generic medication not found.");

    const categoryInput = String(dto.legacyPregnancyCategory ?? "REVIEW_REQUIRED").trim().toUpperCase();
    const category = categoryInput === "E" ? "REVIEW_REQUIRED" : categoryInput;
    const notes = [clean(dto.reproductivePotentialNotes), categoryInput === "E" ? "Imported category E mapped to REVIEW_REQUIRED for doctor review." : null].filter(Boolean).join(" ") || null;
    const sourceName = clean(dto.sourceName) || "Not reviewed";
    const sourceType = clean(dto.sourceType) || "not_reviewed";
    const requestedReviewStatus = clean(dto.reviewStatus) || "needs_review";
    const reviewReason = clean(dto.reviewReason) || clean(dto.sourceRefreshNote);
    if (requestedReviewStatus === "reviewed" && (sourceType === "not_reviewed" || sourceName === "Not reviewed" || !reviewReason)) {
      throw new BadRequestException("Reviewed medication safety profiles require a source name and review reason.");
    }
    const reviewStatus = requestedReviewStatus === "reviewed" ? "reviewed" : requestedReviewStatus;
    const lastCheckedAt = parseDate(dto.lastCheckedAt);
    const sourceLastUpdatedAt = parseDate(dto.sourceLastUpdatedAt);
    const sourceRefreshStatus = normalizeRefreshStatus(dto.sourceRefreshStatus, lastCheckedAt);

    const profile = await this.prisma.medicationSafetyProfile.upsert({
      where: { medicationGenericId },
      update: {
        legacyPregnancyCategory: category as never,
        pregnancyRiskSummary: clean(dto.pregnancyRiskSummary),
        pregnancyClinicalConsiderations: clean(dto.pregnancyClinicalConsiderations),
        pregnancyDataSummary: clean(dto.pregnancyDataSummary),
        trimesterNotesJson: dto.trimesterNotesJson ?? undefined,
        lactationRiskLevel: (clean(dto.lactationRiskLevel) || "REVIEW_REQUIRED") as never,
        lactationRiskSummary: clean(dto.lactationRiskSummary),
        lactationMilkTransferSummary: clean(dto.lactationMilkTransferSummary),
        lactationInfantEffectsSummary: clean(dto.lactationInfantEffectsSummary),
        lactationClinicalConsiderations: clean(dto.lactationClinicalConsiderations),
        reproductivePotentialNotes: notes,
        sourceName,
        sourceUrl: clean(dto.sourceUrl),
        sourceYear: dto.sourceYear ? Number(dto.sourceYear) : null,
        sourceType: sourceType as never,
        reviewStatus: reviewStatus as never,
        confidenceLevel: (clean(dto.confidenceLevel) || "unknown") as never,
        lastCheckedAt,
        sourceLastUpdatedAt,
        sourceVersionLabel: clean(dto.sourceVersionLabel),
        sourceRefreshStatus,
        sourceRefreshNote: reviewReason ?? clean(dto.sourceRefreshNote),
        reviewedByUserId: reviewStatus === "reviewed" ? user.id : null,
        reviewedAt: reviewStatus === "reviewed" ? new Date() : null
      },
      create: {
        medicationGenericId,
        legacyPregnancyCategory: category as never,
        lactationRiskLevel: (clean(dto.lactationRiskLevel) || "REVIEW_REQUIRED") as never,
        sourceName,
        sourceType: sourceType as never,
        reviewStatus: reviewStatus as never,
        confidenceLevel: (clean(dto.confidenceLevel) || "unknown") as never,
        lastCheckedAt,
        sourceLastUpdatedAt,
        sourceVersionLabel: clean(dto.sourceVersionLabel),
        sourceRefreshStatus,
        sourceRefreshNote: reviewReason ?? clean(dto.sourceRefreshNote),
        pregnancyRiskSummary: clean(dto.pregnancyRiskSummary),
        pregnancyClinicalConsiderations: clean(dto.pregnancyClinicalConsiderations),
        pregnancyDataSummary: clean(dto.pregnancyDataSummary),
        trimesterNotesJson: dto.trimesterNotesJson ?? undefined,
        lactationRiskSummary: clean(dto.lactationRiskSummary),
        lactationMilkTransferSummary: clean(dto.lactationMilkTransferSummary),
        lactationInfantEffectsSummary: clean(dto.lactationInfantEffectsSummary),
        lactationClinicalConsiderations: clean(dto.lactationClinicalConsiderations),
        reproductivePotentialNotes: notes,
        sourceUrl: clean(dto.sourceUrl),
        sourceYear: dto.sourceYear ? Number(dto.sourceYear) : null,
        reviewedByUserId: reviewStatus === "reviewed" ? user.id : null,
        reviewedAt: reviewStatus === "reviewed" ? new Date() : null
      }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "medication_safety_profile.updated",
      resourceType: "medication_safety_profile",
      resourceId: profile.id,
      severity: "high",
      metadataJson: { medicationGenericId, reviewStatus: profile.reviewStatus, legacyPregnancyCategory: profile.legacyPregnancyCategory, categoryEMapped: categoryInput === "E", reviewReason }
    });

    return profile;
  }

  private async validateImportRow(row: Record<string, unknown>, rowNumber: number): Promise<ImportPreviewRow | { rowNumber: number; genericName?: string; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    for (const key of Object.keys(row)) {
      if (forbiddenProfileFields.has(key)) errors.push(`Forbidden medication safety profile field: ${key}`);
      if (!allowedImportFields.has(key)) errors.push(`Unsupported medication safety profile field: ${key}`);
    }

    const genericName = clean(row.genericName) ?? "";
    if (!genericName) errors.push("genericName is required.");

    const categoryInput = String(row.legacyPregnancyCategory ?? "REVIEW_REQUIRED").trim().toUpperCase();
    const legacyPregnancyCategory = categoryInput === "E" ? "REVIEW_REQUIRED" : categoryInput;
    if (categoryInput === "E") warnings.push("Category E is not valid and was mapped to REVIEW_REQUIRED.");
    if (!allowedLegacyCategories.has(legacyPregnancyCategory)) errors.push(`Invalid legacyPregnancyCategory: ${categoryInput}`);

    const lactationRiskLevel = String(row.lactationRiskLevel ?? "REVIEW_REQUIRED").trim().toUpperCase();
    if (!allowedLactationLevels.has(lactationRiskLevel)) errors.push(`Invalid lactationRiskLevel: ${lactationRiskLevel}`);

    const sourceName = clean(row.sourceName) ?? "Not reviewed";
    if (sourceName === "Not reviewed") warnings.push("Missing sourceName forces needs_review.");

    const sourceType = clean(row.sourceType) ?? "not_reviewed";
    if (!allowedSourceTypes.has(sourceType)) errors.push(`Invalid sourceType: ${sourceType}`);

    const confidenceLevel = clean(row.confidenceLevel) ?? "unknown";
    if (!allowedConfidenceLevels.has(confidenceLevel)) errors.push(`Invalid confidenceLevel: ${confidenceLevel}`);

    const reviewStatus = clean(row.reviewStatus) ?? "needs_review";
    if (!allowedInputReviewStatuses.has(reviewStatus)) errors.push(`Invalid reviewStatus: ${reviewStatus}`);
    if (reviewStatus === "reviewed") warnings.push("Imported rows are not approved automatically and remain needs_review.");

    let generic: { id: string } | null = null;
    if (genericName) {
      generic = await this.prisma.medicationGeneric.findFirst({
        where: { genericName: { equals: genericName, mode: "insensitive" } },
        select: { id: true }
      });
      if (!generic) errors.push("No matching generic medication found.");
    }

    if (errors.length) return { rowNumber, genericName, errors, warnings };
    return {
      rowNumber,
      genericName,
      medicationGenericId: generic!.id,
      legacyPregnancyCategory,
      lactationRiskLevel,
      sourceName,
      sourceYear: row.sourceYear ? Number(row.sourceYear) : null,
      sourceType,
      confidenceLevel,
      reviewStatus: "needs_review",
      warnings,
      input: row
    };
  }
}

function clean(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseDate(value: unknown) {
  const text = clean(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeRefreshStatus(value: unknown, lastCheckedAt: Date | null) {
  const status = String(value ?? "UNKNOWN").trim().toUpperCase();
  const allowed = new Set(["UNKNOWN", "CURRENT_TODAY", "STALE", "FAILED", "REVIEW_REQUIRED"]);
  if (status === "CURRENT_TODAY" && !isToday(lastCheckedAt)) return "REVIEW_REQUIRED";
  return allowed.has(status) ? status : "UNKNOWN";
}

function isToday(value: Date | null) {
  if (!value) return false;
  const now = new Date();
  return value.getUTCFullYear() === now.getUTCFullYear() && value.getUTCMonth() === now.getUTCMonth() && value.getUTCDate() === now.getUTCDate();
}

function importRowData(row: ImportPreviewRow, categoryInput: string) {
  const notes = [clean(row.input.reproductivePotentialNotes), categoryInput === "E" ? "Imported category E mapped to REVIEW_REQUIRED for doctor review." : null].filter(Boolean).join(" ") || null;
  return {
    legacyPregnancyCategory: row.legacyPregnancyCategory as never,
    pregnancyRiskSummary: clean(row.input.pregnancyRiskSummary),
    pregnancyClinicalConsiderations: clean(row.input.pregnancyClinicalConsiderations),
    pregnancyDataSummary: clean(row.input.pregnancyDataSummary),
    lactationRiskLevel: row.lactationRiskLevel as never,
    lactationRiskSummary: clean(row.input.lactationRiskSummary),
    lactationMilkTransferSummary: clean(row.input.lactationMilkTransferSummary),
    lactationInfantEffectsSummary: clean(row.input.lactationInfantEffectsSummary),
    lactationClinicalConsiderations: clean(row.input.lactationClinicalConsiderations),
    reproductivePotentialNotes: notes,
    sourceName: row.sourceName,
    sourceUrl: clean(row.input.sourceUrl),
    sourceYear: row.sourceYear,
    sourceType: (row.sourceName === "Not reviewed" ? "not_reviewed" : row.sourceType) as never,
    reviewStatus: "needs_review" as never,
    confidenceLevel: row.confidenceLevel as never,
    lastCheckedAt: null,
    sourceLastUpdatedAt: null,
    sourceVersionLabel: null,
    sourceRefreshStatus: "REVIEW_REQUIRED",
    sourceRefreshNote: row.warnings.join(" ") || "Imported source row requires Owner/Admin review.",
    reviewedByUserId: null,
    reviewedAt: null
  };
}

function parseImportRows(dto: Record<string, unknown>) {
  const content = String(dto.content ?? "");
  const fileName = String(dto.fileName ?? "").toLowerCase();
  if (!content.trim()) throw new BadRequestException("Import file content is required.");
  if (fileName.endsWith(".json") || content.trim().startsWith("[")) {
    const data = JSON.parse(content);
    if (!Array.isArray(data)) throw new BadRequestException("JSON import must be an array of rows.");
    return data as Record<string, unknown>[];
  }
  if (!fileName.endsWith(".csv") && !fileName.endsWith(".txt")) throw new BadRequestException("Only owner-provided CSV, JSON, or structured text files are accepted.");
  return parseCsv(content);
}

function parseCsv(text: string) {
  const rows = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length);
  if (!rows.length) return [];
  const headers = splitCsvLine(rows[0] ?? "").map((header) => header.trim());
  return rows.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}
