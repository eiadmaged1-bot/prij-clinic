import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, MaxLength } from "class-validator";
import { ConsentTemplateCategory, ConsentTemplateLanguage } from "@prisma/client";

export class CreateConsentTemplateDto {
  @IsString()
  @MaxLength(80)
  code!: string;

  @IsString()
  @MaxLength(180)
  title!: string;

  @IsEnum(ConsentTemplateCategory)
  category!: ConsentTemplateCategory;

  @IsOptional()
  @IsEnum(ConsentTemplateLanguage)
  language?: ConsentTemplateLanguage;

  @IsString()
  @MaxLength(80)
  versionLabel!: string;

  @IsString()
  @MaxLength(10000)
  bodyText!: string;

  @IsOptional()
  @IsObject()
  fieldsJson?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  requiresWitness?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresGuardian?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateConsentTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  bodyText?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class SignConsentDemoDto {
  @IsString()
  @MaxLength(160)
  signedByName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  relationshipToPatient?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  guardianName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  witnessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  legalNotes?: string;
}

export class ReviewConsentRecordDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  legalNotes?: string;
}
