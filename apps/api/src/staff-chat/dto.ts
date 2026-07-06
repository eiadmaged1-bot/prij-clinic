import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class DirectConversationDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  queueTicketId?: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;
}

export class SendStaffMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  queueTicketId?: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;
}
