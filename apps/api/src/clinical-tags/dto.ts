import { IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

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
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
