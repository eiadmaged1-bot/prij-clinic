import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { SearchMedicationSafetyProfilesDto } from "./dto/search-medication-safety-profiles.dto";

const forbiddenProfileFields = new Set(["dose", "dosage", "frequency", "duration", "instructions", "price", "stock", "tradeName", "brandName", "pharmacy", "inventory"]);

@Injectable()
export class MedicationPregnancyLactationSafetyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async getProfile(medicationGenericId: string) {
    const generic = await this.prisma.medicationGeneric.findUnique({
      where: { id: medicationGenericId },
      include: { safetyProfile: true }
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
