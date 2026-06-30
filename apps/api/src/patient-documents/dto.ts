import { IsDateString, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";
import { PatientDocumentConfidentialityLevel, PatientDocumentStatus, PatientDocumentStorageMode, PatientDocumentType } from "@prisma/client";

export class CreatePatientDocumentDto {
  @IsOptional()
  @IsUUID()
  linkedReportId?: string;

  @IsOptional()
  @IsUUID()
  linkedResultId?: string;

  @IsOptional()
  @IsUUID()
  linkedConsentRecordId?: string;

  @IsOptional()
  @IsUUID()
  linkedEncounterId?: string;

  @IsOptional()
  @IsUUID()
  linkedPrescriptionId?: string;

  @IsString()
  @MaxLength(180)
  title!: string;

  @IsEnum(PatientDocumentType)
  documentType!: PatientDocumentType;

  @IsString()
  @MaxLength(120)
  category!: string;

  @IsOptional()
  @IsEnum(PatientDocumentStorageMode)
  storageMode?: PatientDocumentStorageMode;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fileMimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  fileSizeBytes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  fileSha256?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  sourceText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summaryText?: string;

  @IsOptional()
  @IsObject()
  tagsJson?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(PatientDocumentConfidentialityLevel)
  confidentialityLevel?: PatientDocumentConfidentialityLevel;
}

export class UpdatePatientDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsEnum(PatientDocumentStatus)
  status?: PatientDocumentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summaryText?: string;

  @IsOptional()
  @IsObject()
  tagsJson?: Record<string, unknown>;
}

export class ReviewPatientDocumentDto {
  @IsOptional()
  @IsDateString()
  reviewedAt?: string;
}

export class ArchivePatientDocumentDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class VoidPatientDocumentDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}
