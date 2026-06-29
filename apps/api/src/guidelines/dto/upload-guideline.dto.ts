import { GuidelineAccessLevel, GuidelineLicenseStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class UploadGuidelineDto {
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
