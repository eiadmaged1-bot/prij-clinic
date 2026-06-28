import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";
import { ObUltrasoundStatus, PregnancyStatus } from "@prisma/client";

export class CreatePregnancyDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsEnum(PregnancyStatus)
  status?: PregnancyStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  gravida?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  para?: number;

  @IsOptional()
  @IsDateString()
  lmpDate?: string;

  @IsOptional()
  @IsDateString()
  estimatedDueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  riskLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdatePregnancyDto {
  @IsOptional()
  @IsEnum(PregnancyStatus)
  status?: PregnancyStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  gravida?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  para?: number;

  @IsOptional()
  @IsDateString()
  lmpDate?: string;

  @IsOptional()
  @IsDateString()
  estimatedDueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  riskLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CreateObUltrasoundDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  pregnancyId?: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsDateString()
  performedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(45)
  gestationalAgeWeeks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  gestationalAgeDays?: number;

  @IsOptional()
  @IsInt()
  @Min(40)
  @Max(240)
  fetalHeartRateBpm?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  presentation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  placenta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  amnioticFluid?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  impressionText?: string;
}

export class UpdateObUltrasoundDto {
  @IsOptional()
  @IsEnum(ObUltrasoundStatus)
  status?: ObUltrasoundStatus;

  @IsOptional()
  @IsUUID()
  pregnancyId?: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsDateString()
  performedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(45)
  gestationalAgeWeeks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  gestationalAgeDays?: number;

  @IsOptional()
  @IsInt()
  @Min(40)
  @Max(240)
  fetalHeartRateBpm?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  presentation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  placenta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  amnioticFluid?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  impressionText?: string;
}
