import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { PatientTaskPriority, PatientTaskStatus, PatientTaskType } from "@prisma/client";

export class CreatePatientTaskDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @IsOptional()
  @IsUUID()
  relatedOrderId?: string;

  @IsOptional()
  @IsUUID()
  relatedResultId?: string;

  @IsOptional()
  @IsUUID()
  relatedDocumentId?: string;

  @IsOptional()
  @IsUUID()
  relatedConsentId?: string;

  @IsEnum(PatientTaskType)
  taskType!: PatientTaskType;

  @IsString()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(PatientTaskPriority)
  priority?: PatientTaskPriority;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

export class UpdatePatientTaskDto {
  @IsOptional()
  @IsEnum(PatientTaskStatus)
  status?: PatientTaskStatus;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;
}

export class CancelPatientTaskDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}
