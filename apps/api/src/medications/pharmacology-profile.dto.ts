import { ArrayMaxSize, ArrayMinSize, IsArray, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreatePharmacologySummaryDto {
  @IsUUID() sourceId!: string;
  @IsOptional() @IsArray() @ArrayMinSize(3) @ArrayMaxSize(5) @IsString({ each: true }) mechanismBullets?: string[];
  @IsOptional() @IsArray() @ArrayMinSize(3) @ArrayMaxSize(5) @IsString({ each: true }) pharmacodynamicBullets?: string[];
  @IsOptional() @IsObject() pharmacokinetics?: { absorption?: string[]; metabolism?: string[]; halfLife?: string[]; elimination?: string[]; clinicalNotes?: string[] };
  @IsOptional() @IsString() @MaxLength(1000) authorNote?: string;
}
