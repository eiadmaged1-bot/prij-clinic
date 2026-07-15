import { ArrayMaxSize, ArrayMinSize, IsArray, IsObject, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

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

export class GoogleSheetRowDto {
  @IsString() @MaxLength(64) rowHash!: string;
  @IsString() @MaxLength(80) sourceRow!: string;
  @IsObject() mappedPatient!: Record<string, unknown>;
  @IsOptional() @IsObject() sourceMetadata?: Record<string, unknown>;
}

export class GoogleSheetBatchDto {
  @IsString() @MaxLength(120) sheetId!: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(25) @ValidateNested({ each: true }) @Type(() => GoogleSheetRowDto) rows!: GoogleSheetRowDto[];
}
