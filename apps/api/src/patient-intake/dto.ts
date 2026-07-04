import { IsEnum, IsObject, IsOptional, IsUUID } from "class-validator";
import { PatientIntakeStatus, PatientIntakeType } from "@prisma/client";

export class PatientIntakeDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsEnum(PatientIntakeType)
  intakeType?: PatientIntakeType;

  @IsOptional()
  @IsObject()
  patientReportedJson?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  administrativeJson?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  vitalsJson?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  obsIntakeJson?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  gynIntakeJson?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  redFlagsJson?: Record<string, unknown>;
}

export class UpdatePatientIntakeDto {
  @IsOptional()
  @IsEnum(PatientIntakeType)
  intakeType?: PatientIntakeType;

  @IsOptional()
  @IsObject()
  patientReportedJson?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  administrativeJson?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  vitalsJson?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  obsIntakeJson?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  gynIntakeJson?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  redFlagsJson?: Record<string, unknown>;
}

export class ReviewPatientIntakeDto {
  @IsOptional()
  @IsUUID()
  encounterId?: string;
}

export class ListPatientIntakeQueryDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsEnum(PatientIntakeStatus)
  status?: PatientIntakeStatus;
}
