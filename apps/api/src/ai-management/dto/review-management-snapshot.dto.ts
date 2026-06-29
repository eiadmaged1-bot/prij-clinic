import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewManagementSnapshotDto {
  @IsIn(["approved", "edited", "rejected"])
  decision!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  doctorEditedPlan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
