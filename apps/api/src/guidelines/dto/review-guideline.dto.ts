import { GuidelineReviewDecisionValue } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class ReviewGuidelineDto {
  @IsEnum(GuidelineReviewDecisionValue)
  decision!: GuidelineReviewDecisionValue;

  @IsOptional()
  @IsString()
  reason?: string;
}
