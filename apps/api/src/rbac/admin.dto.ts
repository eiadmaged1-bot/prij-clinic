import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateServiceItemDto {
  @IsString()
  @MaxLength(40)
  code!: string;

  @IsString()
  @MaxLength(140)
  name!: string;

  @IsString()
  @MaxLength(80)
  category!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  doctorShareAmount?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateServiceItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(140)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  doctorShareAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class AdminOverrideDto {
  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsString()
  @IsIn(["CONFIRM"])
  confirmation!: string;
}

export class AppearanceSettingsDto {
  @IsString()
  @IsIn(["prij-heritage", "clinic-premium", "medicolize-portal", "incision-portal", "minimal-clean", "compact-operations"])
  defaultTheme!: string;

  @IsBoolean()
  allowUserThemeOverride!: boolean;

  @IsOptional()
  @IsBoolean()
  defaultDoctorComfortMode?: boolean;
}

export class CreateAccountDto {
  @IsString()
  @MaxLength(80)
  loginId!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsString()
  @MaxLength(140)
  displayName!: string;

  @IsString()
  @IsIn(["Owner", "Admin", "Doctor", "Nurse", "Receptionist", "Accountant"])
  role!: string;

  @IsString()
  @IsIn(["minimum", "standard", "advanced", "custom"])
  permissionPreset!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  temporaryPassword!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(140)
  displayName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @IsIn(["Owner", "Admin", "Doctor", "Nurse", "Receptionist", "Accountant"])
  role?: string;

  @IsOptional()
  @IsString()
  @IsIn(["minimum", "standard", "advanced", "custom"])
  permissionPreset?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ResetAccountPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  temporaryPassword!: string;

  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class AccountStatusChangeDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class UpdateAccountPermissionsDto {
  @IsString()
  @IsIn(["minimum", "standard", "advanced", "custom"])
  permissionPreset!: string;

  @IsArray()
  @ArrayMaxSize(120)
  @IsString({ each: true })
  allowedPermissions!: string[];

  @IsString()
  @MaxLength(500)
  reason!: string;
}
