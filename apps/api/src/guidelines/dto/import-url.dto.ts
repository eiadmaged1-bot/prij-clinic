import { GuidelineAccessLevel } from "@prisma/client";

export class ImportUrlDto {
  sourceId!: string;
  url!: string;
  title!: string;
  specialty!: string;
  topic!: string;
  versionLabel?: string;
  accessLevel?: GuidelineAccessLevel;
  userApprovedPublicRestricted?: boolean;
}
