import { IsIn, IsObject, IsString, MaxLength } from "class-validator";

export class SaveMemoryDto {
  @IsIn(["diagnosis", "treatment_goal", "management_pathway", "protocol_used", "contraindication", "follow_up_plan"])
  memoryType!: string;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsObject()
  valueJson!: Record<string, unknown>;
}
