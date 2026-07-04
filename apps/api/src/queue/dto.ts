import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { QueuePriority } from "@prisma/client";

export class CheckInDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsEnum(QueuePriority)
  priority?: QueuePriority;
}

export class QueueCancelDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}
