import { GuidelineAccessLevel } from "@prisma/client";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

export class ImportUrlDto {
  @IsString()
  sourceId!: string;

  @IsString()
  url!: string;

  @IsString()
  title!: string;

  @IsString()
  specialty!: string;

  @IsString()
  topic!: string;

  @IsOptional()
  @IsString()
  versionLabel?: string;

  @IsOptional()
  @IsEnum(GuidelineAccessLevel)
  accessLevel?: GuidelineAccessLevel;

  @IsOptional()
  @IsBoolean()
  userApprovedPublicRestricted?: boolean;
}
