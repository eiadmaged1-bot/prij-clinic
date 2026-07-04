import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { AppointmentStatus } from "@prisma/client";

export class CreateAppointmentDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  appointmentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
