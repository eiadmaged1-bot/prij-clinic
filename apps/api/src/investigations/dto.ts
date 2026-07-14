import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from "class-validator";
import { InvestigationCategory, InvestigationOrderStatus, InvestigationPriority } from "@prisma/client";

export class InvestigationOrderItemDto {
  @IsEnum(InvestigationCategory)
  category!: InvestigationCategory;

  @IsString()
  @MaxLength(160)
  testName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;
}

export class CreateInvestigationOrderDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsEnum(InvestigationPriority)
  priority?: InvestigationPriority;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsDateString()
  requestedFollowUpDate?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvestigationOrderItemDto)
  items!: InvestigationOrderItemDto[];
}

export class UpdateInvestigationOrderStatusDto {
  @IsEnum(InvestigationOrderStatus)
  status!: InvestigationOrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class InvestigationFavoriteSetDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nameAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  icon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  scope?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  defaultVisitType?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  investigationCatalogItemIds!: string[];
}

export class InvestigationCatalogItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  code?: string;

  @IsString()
  @MaxLength(180)
  name!: string;

  @IsString()
  @MaxLength(120)
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subcategory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  clinicalGroup?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  modality?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CancelClinicalRequestDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class ClinicalRequestItemDto {
  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsUUID()
  catalogItemId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  requestType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  requestNote?: string;
}

export class CreateClinicalRequestDto {
  @IsUUID()
  patientId!: string;

  @IsUUID()
  encounterId!: string;

  @IsOptional()
  @IsEnum(InvestigationPriority)
  priority?: InvestigationPriority;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  requestNote?: string;

  @IsOptional()
  @IsDateString()
  requestedFollowUpDate?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClinicalRequestItemDto)
  items!: ClinicalRequestItemDto[];
}
