import { IsBoolean, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class GoogleFormIntakeDto {
  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  externalSubmissionId?: string;

  @IsOptional()
  @IsString()
  submittedAt?: string;

  @IsOptional()
  @IsObject()
  rawAnswers?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  patient?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  mappedCaseType?: Record<string, unknown>;
}

export class CreatePatientFromSubmissionDto {
  @IsOptional()
  @IsBoolean()
  createInitialPhase?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewReason?: string;
}

export class AttachSubmissionDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsObject()
  selectedFields?: Record<string, boolean>;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewReason?: string;
}

export class RejectSubmissionDto {
  @IsString()
  @MaxLength(1000)
  reason!: string;
}
