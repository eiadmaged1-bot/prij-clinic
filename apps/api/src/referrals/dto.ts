import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { ReferralDirection, ReferralStatus, ReferralType, ReferralUrgency } from "@prisma/client";

export class CreateReferralDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsUUID()
  pregnancyId?: string;

  @IsOptional()
  @IsEnum(ReferralDirection)
  referralDirection?: ReferralDirection;

  @IsEnum(ReferralType)
  referralType!: ReferralType;

  @IsOptional()
  @IsUUID()
  referredToProviderId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  referredToText?: string;

  @IsString()
  @MaxLength(1000)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  clinicalSummary?: string;

  @IsOptional()
  @IsEnum(ReferralUrgency)
  urgency?: ReferralUrgency;
}

export class UpdateReferralDto {
  @IsOptional()
  @IsEnum(ReferralStatus)
  status?: ReferralStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  clinicalSummary?: string;

  @IsOptional()
  @IsDateString()
  sentAt?: string;
}

export class CloseReferralDto {
  @IsString()
  @MaxLength(1000)
  closureNote!: string;
}
