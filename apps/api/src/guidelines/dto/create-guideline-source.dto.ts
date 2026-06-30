import { GuidelineAccessLevel, GuidelineSourceType } from "@prisma/client";
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

export class CreateGuidelineSourceDto {
  @IsString()
  name!: string;

  @IsString()
  organization!: string;

  @IsEnum(GuidelineSourceType)
  sourceType!: GuidelineSourceType;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  countryOrRegion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsEnum(GuidelineAccessLevel)
  defaultAccessLevel?: GuidelineAccessLevel;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
