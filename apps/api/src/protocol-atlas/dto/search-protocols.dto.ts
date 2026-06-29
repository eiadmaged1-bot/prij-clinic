import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class SearchProtocolsDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  query?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  group?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  riskLevel?: string;

  @IsOptional()
  @IsBoolean()
  verifiedOnly?: boolean;
}
