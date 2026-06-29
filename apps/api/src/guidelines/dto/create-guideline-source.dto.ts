import { GuidelineAccessLevel, GuidelineSourceType } from "@prisma/client";

export class CreateGuidelineSourceDto {
  name!: string;
  organization!: string;
  sourceType!: GuidelineSourceType;
  websiteUrl?: string;
  countryOrRegion?: string;
  specialties?: string[];
  defaultAccessLevel?: GuidelineAccessLevel;
  notes?: string;
  active?: boolean;
}
