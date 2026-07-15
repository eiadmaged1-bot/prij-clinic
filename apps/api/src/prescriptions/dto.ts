import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsBoolean, IsObject, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from "class-validator";

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
  @IsUUID()
  medicationGenericId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  strengthText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  dosageForm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  optionalBrandOrTradeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  quantityText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  dispensingUnit?: string;

  @IsOptional()
  @IsBoolean()
  manualEntry?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  dose?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  doseUnit?: string;

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
  @IsBoolean()
  prn?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  customReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;
}

export class CreatePrescriptionDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  sourceType?: "manual" | "template" | "doctor_shortcut";

  @IsOptional()
  @IsObject()
  printSnapshotJson?: Record<string, unknown>;

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

export class PrescriptionTemplateDto {
  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  templateScope?: "personal" | "clinic";

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  diagnosisOrUseCase?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items!: PrescriptionItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class DoctorMedicationShortcutDto {
  @IsString()
  @MaxLength(160)
  displayName!: string;

  @IsString()
  @MaxLength(160)
  genericName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  optionalBrandOrTradeName?: string;

  @IsOptional()
  @IsUUID()
  medicationCatalogId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  defaultInstructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  defaultDoseText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  defaultTimingText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  defaultDurationText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  defaultNotes?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
