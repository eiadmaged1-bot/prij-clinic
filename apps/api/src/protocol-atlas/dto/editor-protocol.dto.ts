import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString, IsUrl, Max, MaxLength, Min, ValidateNested } from "class-validator";

export class ProtocolReasonDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class UpdateProtocolSourceDto extends ProtocolReasonDto {
  @IsString()
  @MaxLength(300)
  sourceName!: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
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

export class UpdateProtocolAliasesDto extends ProtocolReasonDto {
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  aliases!: string[];
}

export class StructuredProtocolContentDto {
  @IsString()
  @MaxLength(700)
  summary!: string;

  @IsBoolean()
  verifiedManagementAvailable!: boolean;

  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  goals!: string[];

  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  options!: string[];

  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  safetyChecks!: string[];

  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  contraindicationChecks!: string[];

  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  redFlags!: string[];

  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  followUpConsiderations!: string[];

  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  referralConsiderations!: string[];

  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  limitations!: string[];
}

export class UpdateStructuredProtocolContentDto extends ProtocolReasonDto {
  @ValidateNested()
  @Type(() => StructuredProtocolContentDto)
  content!: StructuredProtocolContentDto;
}

export class UpdateProtocolCompletionDto extends ProtocolReasonDto {
  @IsObject() questionnaire!: Record<string, unknown>;
  @IsObject() connections!: Record<string, unknown>;
}
