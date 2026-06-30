import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { PatientInternalNoteType, PatientInternalNoteVisibility } from "@prisma/client";

export class CreatePatientInternalNoteDto {
  @IsEnum(PatientInternalNoteType)
  noteType!: PatientInternalNoteType;

  @IsOptional()
  @IsEnum(PatientInternalNoteVisibility)
  visibility?: PatientInternalNoteVisibility;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsString()
  @MaxLength(3000)
  bodyText!: string;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}

export class UpdatePatientInternalNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  bodyText?: string;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}

export class ArchivePatientInternalNoteDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}
