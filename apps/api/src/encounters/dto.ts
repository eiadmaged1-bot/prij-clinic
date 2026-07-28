import { IsBoolean, IsDateString, IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { EncounterStatus } from "@prisma/client";

export class CreateEncounterDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  historyText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  examText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  assessmentText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  planText?: string;

  @IsOptional()
  @IsBoolean()
  doctorReviewedIntake?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  doctorReviewStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  historyClarification?: string;

  @IsOptional()
  @IsObject()
  examinationJson?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  ultrasoundFindingsJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  clinicalImpression?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  riskClassification?: string;

  @IsOptional()
  @IsObject()
  followUpJson?: Record<string, unknown>;
}

export class UpdateEncounterDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  historyText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  examText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  assessmentText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  planText?: string;

  @IsOptional()
  @IsBoolean()
  doctorReviewedIntake?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  doctorReviewStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  historyClarification?: string;

  @IsOptional()
  @IsObject()
  examinationJson?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  ultrasoundFindingsJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  clinicalImpression?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  riskClassification?: string;

  @IsOptional()
  @IsObject()
  followUpJson?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(EncounterStatus)
  status?: EncounterStatus;
}

export class VoidEncounterDto {
  @IsString()
  @MaxLength(1000)
  reason!: string;
}

export class SignEncounterDto {
  @IsDateString()
  expectedRevision!: string;
}
