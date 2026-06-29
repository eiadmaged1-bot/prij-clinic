import { GuidelineReviewDecisionValue } from "@prisma/client";

export class ReviewGuidelineDto {
  decision!: GuidelineReviewDecisionValue;
  reason?: string;
}
