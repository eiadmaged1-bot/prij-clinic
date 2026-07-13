import { IsBoolean, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class GoogleFormIntakeDto {
  @IsString()
  @MaxLength(200)
  submissionId!: string;

  @IsString()
  @MaxLength(80)
  submittedAt!: string;

  @IsString()
  @MaxLength(240)
  fullName!: string;

  @IsString()
  @MaxLength(40)
  primaryPhone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  spouseName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  birthValue?: string;

  @IsString()
  @MaxLength(80)
  followUpType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  secondaryPhone?: string;
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

export class RequestCorrectionDto {
  @IsString()
  @MaxLength(1000)
  reason!: string;
}
