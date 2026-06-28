import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { ReportCategory, ReportStatus } from "@prisma/client";

export class CreateReportDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsUUID()
  investigationOrderId?: string;

  @IsEnum(ReportCategory)
  category!: ReportCategory;

  @IsString()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resultSummary?: string;
}

export class UpdateReportDto {
  @IsOptional()
  @IsEnum(ReportCategory)
  category?: ReportCategory;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resultSummary?: string;
}
