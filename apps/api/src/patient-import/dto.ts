import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class PreviewPatientImportDto {
  @IsString() @MaxLength(240) fileName!: string;
  @IsString() @MaxLength(64) fileHash!: string;
  @IsIn(["csv", "xlsx"]) fileType!: "csv" | "xlsx";
  @IsOptional() @IsString() @MaxLength(40) encoding?: string;
  @IsObject() mapping!: Record<string, string>;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(5000) rows!: Array<Record<string, unknown>>;
}

export class CommitPatientImportDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(5000) @IsUUID("4", { each: true }) rowIds!: string[];
  @IsOptional() @IsObject() decisions?: Record<string, string>;
  @IsOptional() @IsObject() decisionReasons?: Record<string, string>;
}

export class UpdatePatientImportReviewDto {
  @IsIn(["CONFIRM_CREATE", "SKIP", "RESOLVE_EXISTING", "ATTACH_EXISTING", "UPDATE_EXISTING", "CREATE_SEPARATE_WITH_REASON", "BLOCKED", "REQUEST_CORRECTION"]) decision!: string;
  @IsOptional() @IsBoolean() selected?: boolean;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

export class RollbackPatientImportDto {
  @IsString() @MaxLength(500) reason!: string;
}
