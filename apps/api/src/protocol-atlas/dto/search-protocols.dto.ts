import { IsOptional, IsString, MaxLength } from "class-validator";

export class SearchProtocolsDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  query?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  group?: string;
}
