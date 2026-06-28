import { Type } from "class-transformer";
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

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

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;
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
}

export class AdminOverrideDto {
  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsString()
  @IsIn(["CONFIRM"])
  confirmation!: string;
}
