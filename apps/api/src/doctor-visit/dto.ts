import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { COMPLAINT_LIFECYCLE_STATUS, type ComplaintLifecycleStatus } from "../complaints/complaint-lifecycle";

export class StartDoctorVisitDto {
  @IsOptional()
  @IsUUID()
  appointmentId?: string;
}

export class UpdateDoctorVisitDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  chiefComplaint?: string;

  @IsOptional()
  @IsEnum(COMPLAINT_LIFECYCLE_STATUS)
  complaintStatus?: ComplaintLifecycleStatus;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  historyText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  examText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  assessmentText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  planText?: string;
}

export class CreateFollowUpDto {
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
