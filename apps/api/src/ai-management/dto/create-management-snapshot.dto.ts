import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";

export class CreateManagementSnapshotDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsString()
  @MaxLength(300)
  diagnosisText!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  protocolCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  clinicalGoal?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsIn(["unknown", "not_pregnant", "pregnant", "postpartum", "trying_to_conceive"])
  pregnancyStatus?: string;

  @IsOptional()
  @IsBoolean()
  tryingToConceive?: boolean;

  @IsOptional()
  @IsBoolean()
  lactating?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  previousTreatments?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  contraindications?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  redFlags?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
