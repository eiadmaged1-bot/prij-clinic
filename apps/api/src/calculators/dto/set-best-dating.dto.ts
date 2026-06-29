import { IsOptional, IsString, MaxLength } from "class-validator";

export class SetBestDatingDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class ChangeLockedDatingDto {
  @IsString()
  @MaxLength(1000)
  reason!: string;
}
