import { IsOptional, IsString } from "class-validator";

export class SearchGuidelinesDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional() @IsString() year?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() reviewStatus?: string;
  @IsOptional() @IsString() sourceKind?: string;
  @IsOptional() @IsString() clinicalArea?: string;
  @IsOptional() @IsString() synthesis?: string;
}
