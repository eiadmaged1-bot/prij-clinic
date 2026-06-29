import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { GynecologyVisitTemplate } from "@prisma/client";

export class CreateGynecologyVisitDto {
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsEnum(GynecologyVisitTemplate)
  templateType?: GynecologyVisitTemplate;

  @IsOptional()
  @IsDateString()
  visitDate?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  reasonForVisit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  menstrualHistory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bleedingPattern?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  painSymptoms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  dischargeSymptoms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  obstetricHistorySummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  contraceptionHistory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  medicalSurgicalHistory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  examinationNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  doctorImpression?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  doctorPlan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  cycleRegularity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  bleedingDuration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  bleedingAmount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  clots?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  intermenstrualBleeding?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  postcoitalBleeding?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  associatedSymptoms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  pregnancyTestNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  painOnset?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  painDuration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  painSite?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  relationToCycle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  painSeverity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  urinaryBowelSymptoms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  cyclePattern?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  acneHirsutismNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  weightMetabolicRiskNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  ultrasoundNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  labsNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  findingSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  sizeLocationNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  symptoms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  followUpPlan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  currentMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  previousMethods?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  contraindicationChecklist?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  counselingNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  chosenMethod?: string;
}
