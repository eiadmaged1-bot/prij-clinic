import { IsDateString, IsEnum, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";
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
  @IsInt()
  @Min(0)
  @Max(20)
  living?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  abortions?: number;

  @IsOptional()
  @IsDateString()
  lmpDate?: string;

  @IsOptional()
  @IsDateString()
  estimatedDueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  datingMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  riskLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  riskFlags?: string;

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
  @IsInt()
  @Min(0)
  @Max(20)
  living?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  abortions?: number;

  @IsOptional()
  @IsDateString()
  lmpDate?: string;

  @IsOptional()
  @IsDateString()
  estimatedDueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  datingMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  riskLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  riskFlags?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CreatePreviousPregnancyDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  pregnancyEpisodeId?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsDateString()
  outcomeDate?: string;

  @IsString()
  @MaxLength(120)
  outcome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  outcomeType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  gestationalAgeAtOutcome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  modeOfDelivery?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  babyOutcome?: string;

  @IsOptional()
  livingChild?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  previousCesareanCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cesareanIndication?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cesareanComplications?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  birthWeightGrams?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  sex?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  complications?: string;

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
  fetusId?: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsDateString()
  performedAt?: string;

  @IsOptional() @IsIn(["OB", "GYN", "FERTILITY"]) clinicalContext?: string;
  @IsOptional() @IsInt() @Min(1) @Max(60) cycleDay?: number;
  @IsOptional() @IsObject() structuredFindingsJson?: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(2000) comparisonText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  scanType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  indication?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  gestationalAgeDisplay?: string;

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
  @MaxLength(500)
  fetalHeartText?: string;

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
  @IsNumber()
  @Min(0)
  @Max(300)
  bpdMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  hcMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  acMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  flMm?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(7000)
  efwGrams?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  dopplerNote?: string;

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
  fetusId?: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsDateString()
  performedAt?: string;

  @IsOptional() @IsIn(["OB", "GYN", "FERTILITY"]) clinicalContext?: string;
  @IsOptional() @IsInt() @Min(1) @Max(60) cycleDay?: number;
  @IsOptional() @IsObject() structuredFindingsJson?: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(2000) comparisonText?: string;
  @IsOptional() @IsString() @MaxLength(500) amendmentReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  scanType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  indication?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  gestationalAgeDisplay?: string;

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
  @MaxLength(500)
  fetalHeartText?: string;

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
  @IsNumber()
  @Min(0)
  @Max(300)
  bpdMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  hcMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  acMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  flMm?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(7000)
  efwGrams?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  dopplerNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  impressionText?: string;
}

export class CreatePregnancyFetusDto {
  @IsString()
  @MaxLength(40)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  chorionicity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  amnionicity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateAntenatalVisitDto {
  @IsOptional()
  @IsDateString()
  visitDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  gestationalAgeDisplay?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  bloodPressure?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  weightKg?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(250)
  pulseBpm?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  edema?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  urineProtein?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  symptomsText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  examinationText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fetalHeartText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fundalHeightText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  planText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  medicationsNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  investigationsNote?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpDate?: string;
}
