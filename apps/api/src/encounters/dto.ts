import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { EncounterStatus } from "@prisma/client";
import { COMPLAINT_LIFECYCLE_STATUS, type ComplaintLifecycleStatus } from "../complaints/complaint-lifecycle";

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
  @IsEnum(COMPLAINT_LIFECYCLE_STATUS)
  complaintStatus?: ComplaintLifecycleStatus;

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
  @IsEnum(COMPLAINT_LIFECYCLE_STATUS)
  complaintStatus?: ComplaintLifecycleStatus;

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

export class SignEncounterDto {
  @IsUUID()
  patientId!: string;
}

export class VoidEncounterDto {
  @IsString()
  @MaxLength(1000)
  reason!: string;
}
