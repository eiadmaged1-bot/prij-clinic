import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from "class-validator";

export class GuidelineSummaryCitationDto {
  @IsInt() @Min(0) bulletIndex!: number;
  @IsInt() @Min(1) pageStart!: number;
  @IsOptional() @IsInt() @Min(1) pageEnd?: number;
  @IsOptional() @IsUUID() sectionId?: string;
  @IsOptional() @IsUUID() chunkId?: string;
  @IsIn(["DIRECT_RECOMMENDATION", "BACKGROUND_INFORMATION", "LOCAL_CLINIC_NOTE", "AI_GENERATED_DRAFT", "DOCTOR_ANNOTATION"])
  citationType!: string;
  @IsString() @MaxLength(240) label!: string;
}

export class GuidelineSummarySectionDto {
  @IsIn(["AT_A_GLANCE", "SCOPE_POPULATION", "KEY_RECOMMENDATIONS", "ASSESSMENT_DIAGNOSIS", "INVESTIGATIONS", "RISK_STRATIFICATION", "MANAGEMENT", "MEDICATION_GUIDANCE", "PROCEDURES_INTERVENTIONS", "SPECIAL_POPULATIONS", "PREGNANCY_LACTATION", "MONITORING", "FOLLOW_UP", "ESCALATION_REFERRAL", "RED_FLAGS", "WHAT_NOT_TO_DO", "EVIDENCE_LIMITATIONS", "DECISION_PATHWAY"])
  sectionType!: string;
  @IsString() @MaxLength(160) heading!: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) @IsString({ each: true }) bullets!: string[];
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => GuidelineSummaryCitationDto)
  citations!: GuidelineSummaryCitationDto[];
}

export class CreateGuidelineSummaryDto {
  @IsOptional() @IsUUID() versionId?: string;
  @IsIn(["AI_GENERATED_DRAFT", "DOCTOR_AUTHORED_DRAFT", "LOCAL_CLINIC_NOTE"])
  provenanceType!: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(18) @ValidateNested({ each: true }) @Type(() => GuidelineSummarySectionDto)
  sections!: GuidelineSummarySectionDto[];
}

export class ReviewGuidelineSummaryDto {
  @IsIn(["CLINIC_APPROVED", "REJECTED", "SUPERSEDED", "ARCHIVED"])
  decision!: string;
  @IsString() @MaxLength(1000) reason!: string;
}
