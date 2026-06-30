import { GuidelineAccessLevel, GuidelineSourceType } from "@prisma/client";
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

export class CreateGuidelineSourceDto {
  @IsOptional()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsEnum(GuidelineSourceType)
  sourceType?: GuidelineSourceType;

  @IsOptional()
  @IsString()
  abbreviation?: string;

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
