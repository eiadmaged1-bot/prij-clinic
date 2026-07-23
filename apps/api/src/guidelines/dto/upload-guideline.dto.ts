import { GuidelineAccessLevel, GuidelineLicenseStatus } from "@prisma/client";
import { IsArray, IsDateString, IsEnum, IsIn, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { Transform } from "class-transformer";

export class UploadGuidelineDto {
  @IsIn(["create_new_guideline", "create_new_version", "restore_archived"])
  uploadIntent!: "create_new_guideline" | "create_new_version" | "restore_archived";

  @IsOptional()
  @IsUUID()
  targetDocumentId?: string;
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsString()
  sourceOrganization?: string;

  @IsString()
  specialty!: string;

  @IsString()
  topic!: string;

  @IsOptional()
  @IsString()
  subtopic?: string;

  @IsOptional()
  @IsString()
  versionLabel?: string;

  @IsOptional() @IsString() @MaxLength(120)
  guidelineCode?: string;

  @IsOptional() @IsString() @MaxLength(12)
  language?: string;

  @IsOptional() @Transform(({ value }) => Array.isArray(value) ? value : String(value).split(",").map((item) => item.trim()).filter(Boolean)) @IsArray() @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsDateString()
  publicationDate?: string;

  @IsOptional()
  @IsEnum(GuidelineLicenseStatus)
  licenseStatus?: GuidelineLicenseStatus;

  @IsOptional()
  @IsEnum(GuidelineAccessLevel)
  accessLevel?: GuidelineAccessLevel;
}
