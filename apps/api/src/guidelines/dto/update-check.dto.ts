import { IsOptional, IsString } from "class-validator";

export class UpdateCheckDto {
  @IsOptional()
  @IsString()
  url?: string;
}
