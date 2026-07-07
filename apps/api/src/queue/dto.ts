import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { QueuePriority, VisitType } from "@prisma/client";

export class CheckInDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsEnum(QueuePriority)
  priority?: QueuePriority;

  @IsOptional()
  @IsEnum(VisitType)
  visitType?: VisitType;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  checkInMethod?: string;
}

export class QueueCancelDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}
