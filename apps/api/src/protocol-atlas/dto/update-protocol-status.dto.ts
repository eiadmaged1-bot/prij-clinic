import { IsIn, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class UpdateProtocolStatusDto {
  @IsIn(["verified", "draft", "catalog_only", "retired"])
  implementationStatus!: string;

  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  sourceName?: string;

  @IsOptional()
  sourceYear?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sourceVersion?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  sourceUrl?: string;
}
