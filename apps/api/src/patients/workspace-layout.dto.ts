import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from "class-validator";

export class WorkspacePanelLayoutDto {
  @IsString() @MaxLength(80) panelKey!: string;
  @IsInt() @Min(0) @Max(100) order!: number;
  @IsInt() @Min(1) @Max(12) column!: number;
  @IsIn(["SMALL", "MEDIUM", "WIDE", "FULL"]) size!: "SMALL" | "MEDIUM" | "WIDE" | "FULL";
  @IsBoolean() collapsed!: boolean;
  @IsBoolean() pinned!: boolean;
  @IsBoolean() hidden!: boolean;
}

export class SaveWorkspaceLayoutDto {
  @IsIn(["CLINIC", "ROLE", "SPECIALTY", "PERSONAL", "PATIENT"])
  scope!: "CLINIC" | "ROLE" | "SPECIALTY" | "PERSONAL" | "PATIENT";

  @IsString() @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(80) roleKey?: string;
  @IsOptional() @IsString() @MaxLength(80) specialtyKey?: string;
  @IsOptional() @IsString() @MaxLength(80) presetKey?: string;
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;

  @IsArray() @ArrayMaxSize(60) @ValidateNested({ each: true }) @Type(() => WorkspacePanelLayoutDto)
  panels!: WorkspacePanelLayoutDto[];
}

export class MissingInformationDecisionDto {
  @IsIn(["NOT_APPLICABLE", "PATIENT_DECLINED", "AWAITING_EXTERNAL_RESULT", "DISMISS", "SNOOZE"])
  decision!: "NOT_APPLICABLE" | "PATIENT_DECLINED" | "AWAITING_EXTERNAL_RESULT" | "DISMISS" | "SNOOZE";

  @IsString() @MaxLength(500) reason!: string;
  @IsOptional() @IsString() @MaxLength(40) snoozedUntil?: string;
}
