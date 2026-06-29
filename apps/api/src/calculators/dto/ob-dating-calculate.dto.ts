import { IsDateString, IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";

export class ObDatingCalculateDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  pregnancyEpisodeId?: string;

  @IsIn(["LMP", "LMP_CYCLE_ADJUSTED", "CONCEPTION", "IVF", "ULTRASOUND_GA", "ULTRASOUND_BIOMETRY", "KNOWN_EDD", "GA_ON_DATE", "MANUAL_DOCTOR"])
  datingSource!: string;

  @IsOptional()
  @IsDateString()
  lmpDate?: string;

  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(45)
  cycleLengthDays?: number;

  @IsOptional()
  @IsDateString()
  conceptionDate?: string;

  @IsOptional()
  @IsDateString()
  embryoTransferDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(7)
  embryoAgeDays?: number;

  @IsOptional()
  @IsDateString()
  scanDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(45)
  gaWeeks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  gaDays?: number;

  @IsOptional()
  @IsDateString()
  knownEdd?: string;

  @IsOptional()
  @IsDateString()
  assessmentDate?: string;

  @IsOptional()
  @IsObject()
  measurements?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
