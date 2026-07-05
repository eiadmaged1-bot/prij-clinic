import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { AiDraftStatus, AiDraftType } from "@prisma/client";

export class CreateAiDraftDto {
  @IsEnum(AiDraftType)
  draftType!: AiDraftType;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  inputSourceSummary?: string;
}

export class ReviewAiDraftDto {
  @IsEnum(AiDraftStatus)
  status!: AiDraftStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNote?: string;
}

export class GenerateAssistantDraftDto {
  @IsString()
  @MaxLength(80)
  draftKind!: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;
}
