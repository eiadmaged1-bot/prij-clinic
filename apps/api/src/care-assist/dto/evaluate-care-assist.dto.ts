import { IsOptional, IsUUID } from "class-validator";

export class EvaluateCareAssistDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsUUID()
  historySheetId?: string;

  @IsOptional()
  @IsUUID()
  prescriptionId?: string;

  @IsOptional()
  @IsUUID()
  investigationOrderId?: string;
}
