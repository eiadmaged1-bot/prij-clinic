import { IsBoolean, IsDateString, IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { InvestigationCategory, InvestigationResultReviewStatus } from "@prisma/client";

export class CreateInvestigationResultDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  orderItemId?: string;

  @IsOptional()
  @IsUUID()
  reportId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  resultNumber?: string;

  @IsEnum(InvestigationCategory)
  category!: InvestigationCategory;

  @IsString()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsDateString()
  resultDate?: string;

  @IsOptional()
  @IsDateString()
  sampleDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  performedByText?: string;

  @IsOptional()
  @IsUUID()
  externalProviderId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summaryText?: string;

  @IsOptional()
  @IsObject()
  structuredValuesJson?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  abnormalFlag?: boolean;

  @IsOptional()
  @IsBoolean()
  criticalFlag?: boolean;
}

export class UpdateInvestigationResultDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summaryText?: string;

  @IsOptional()
  @IsObject()
  structuredValuesJson?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  abnormalFlag?: boolean;

  @IsOptional()
  @IsBoolean()
  criticalFlag?: boolean;

  @IsOptional()
  @IsEnum(InvestigationResultReviewStatus)
  reviewStatus?: InvestigationResultReviewStatus;
}

export class ReviewInvestigationResultDto {
  @IsOptional()
  @IsEnum(InvestigationResultReviewStatus)
  reviewStatus?: InvestigationResultReviewStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  doctorComment?: string;

  @IsOptional()
  @IsBoolean()
  followUpNeeded?: boolean;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsBoolean()
  acknowledgeCritical?: boolean;
}

export class VoidInvestigationResultDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}
