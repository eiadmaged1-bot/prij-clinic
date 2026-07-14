import { IsBoolean, IsDateString, IsIn, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class ManualClinicalTagDto {
  @IsString()
  @MaxLength(120)
  tagCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsDateString()
  tagDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2200)
  tagYear?: number;

  @IsOptional()
  @IsIn(["current", "historical", "resolved"])
  historyStatus?: "current" | "historical" | "resolved";

  @IsOptional()
  @IsObject()
  detailJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  manualNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateClinicalTagDto {
  @IsOptional()
  @IsBoolean()
  doctorConfirmed?: boolean;
  @IsOptional()
  @IsIn(["current", "historical", "resolved"])
  historyStatus?: "current" | "historical" | "resolved";

  @IsOptional()
  @IsIn(["active", "historical", "resolved"])
  status?: "active" | "historical" | "resolved";

  @IsOptional()
  @IsDateString()
  resolutionDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsDateString()
  tagDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2200)
  tagYear?: number;

  @IsOptional()
  @IsObject()
  detailJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  manualNote?: string;
}
