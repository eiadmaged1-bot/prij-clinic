import { GuidelineAccessLevel, GuidelineLicenseStatus } from "@prisma/client";
import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from "class-validator";

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

  @IsOptional()
  @IsEnum(GuidelineLicenseStatus)
  licenseStatus?: GuidelineLicenseStatus;

  @IsOptional()
  @IsEnum(GuidelineAccessLevel)
  accessLevel?: GuidelineAccessLevel;
}
