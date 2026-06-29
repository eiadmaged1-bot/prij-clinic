import { IsBoolean, IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CalculateDto {
  @IsString()
  @MaxLength(120)
  formulaCode!: string;

  @IsObject()
  input!: Record<string, unknown>;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  pregnancyEpisodeId?: string;

  @IsOptional()
  @IsUUID()
  fetusId?: string;

  @IsOptional()
  @IsIn(["calculator_hub", "patient_file", "pregnancy_dating", "ultrasound", "lab", "manual"])
  sourceContext?: string;

  @IsOptional()
  @IsBoolean()
  saveToHistory?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class ReviewCalculationDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
