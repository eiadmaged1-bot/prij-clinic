import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class SearchMedicationSafetyProfilesDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsIn(["A", "B", "C", "D", "X", "N", "UNKNOWN", "REVIEW_REQUIRED"])
  legacyPregnancyCategory?: string;

  @IsOptional()
  @IsIn(["COMPATIBLE", "CAUTION", "AVOID", "INSUFFICIENT_DATA", "UNKNOWN", "REVIEW_REQUIRED"])
  lactationRiskLevel?: string;

  @IsOptional()
  @IsIn(["reviewed", "needs_review", "imported", "retired"])
  reviewStatus?: string;
}
