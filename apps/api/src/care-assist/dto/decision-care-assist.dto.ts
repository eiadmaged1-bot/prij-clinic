import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class DecisionCareAssistDto {
  @IsIn(["ACCEPT", "DISMISS", "SNOOZE", "RESOLVE"])
  decision!: "ACCEPT" | "DISMISS" | "SNOOZE" | "RESOLVE";

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @IsDateString()
  snoozedUntil?: string;
}
