import { IsEnum, IsOptional, IsUUID } from "class-validator";
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
