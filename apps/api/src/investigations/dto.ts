import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from "class-validator";
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

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvestigationOrderItemDto)
  items!: InvestigationOrderItemDto[];
}

export class UpdateInvestigationOrderStatusDto {
  @IsEnum(InvestigationOrderStatus)
  status!: InvestigationOrderStatus;
}
