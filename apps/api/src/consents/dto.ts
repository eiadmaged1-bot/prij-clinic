import { ConsentStatus, ConsentType } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateConsentDto {
  @IsUUID()
  patientId!: string;

  @IsEnum(ConsentType)
  consentType!: ConsentType;

  @IsEnum(ConsentStatus)
  status!: ConsentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
