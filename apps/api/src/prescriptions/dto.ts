import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from "class-validator";

export class PrescriptionItemDto {
  @IsString()
  @MaxLength(160)
  medicationName!: string;

  @IsOptional()
  @IsUUID()
  medicationProductId?: string;

  @IsOptional()
  @IsUUID()
  drugMarketVariantId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  dose?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  route?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  frequency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  duration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;
}

export class CreatePrescriptionDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items!: PrescriptionItemDto[];
}

export class UpdatePrescriptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items?: PrescriptionItemDto[];
}
