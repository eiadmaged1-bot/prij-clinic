import { IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
export class CreateDermatologyFindingDto {
  @IsUUID() encounterId!: string;
  @IsOptional() @IsUUID() conditionId?: string;
  @IsString() @MaxLength(120) stableTag!: string;
  @IsObject() details!: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(120) bodyArea?: string;
  @IsOptional() @IsIn(["active", "historical", "resolved"]) status?: string;
  @IsOptional() @IsString() @MaxLength(1000) nextAction?: string;
  @IsOptional() @IsString() @MaxLength(1000) followUp?: string;
}
