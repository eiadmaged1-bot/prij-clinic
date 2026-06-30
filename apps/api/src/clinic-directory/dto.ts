import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ClinicDepartmentType, ExternalProviderType } from "@prisma/client";

export class CreateExternalProviderDto {
  @IsString()
  @MaxLength(180)
  name!: string;

  @IsEnum(ExternalProviderType)
  providerType!: ExternalProviderType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateExternalProviderDto extends CreateExternalProviderDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateClinicDepartmentDto {
  @IsString()
  @MaxLength(60)
  code!: string;

  @IsString()
  @MaxLength(160)
  name!: string;

  @IsEnum(ClinicDepartmentType)
  departmentType!: ClinicDepartmentType;
}

export class UpdateClinicDepartmentDto extends CreateClinicDepartmentDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
