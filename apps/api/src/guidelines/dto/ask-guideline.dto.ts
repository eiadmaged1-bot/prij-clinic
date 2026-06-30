import { IsIn, IsOptional, IsString } from "class-validator";

export class AskGuidelineDto {
  @IsString()
  question!: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsIn(["concise", "compare", "reading_list", "management_summary"])
  mode?: "concise" | "compare" | "reading_list" | "management_summary";
}
