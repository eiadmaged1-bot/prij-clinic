import { GuidelineAccessLevel, GuidelineLicenseStatus } from "@prisma/client";

export class UploadGuidelineDto {
  title!: string;
  sourceId?: string;
  sourceOrganization?: string;
  specialty!: string;
  topic!: string;
  subtopic?: string;
  versionLabel?: string;
  licenseStatus?: GuidelineLicenseStatus;
  accessLevel?: GuidelineAccessLevel;
}
