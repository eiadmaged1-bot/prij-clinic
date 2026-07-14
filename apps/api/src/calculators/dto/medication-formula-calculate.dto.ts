import { IsObject } from "class-validator";

export class MedicationFormulaCalculateDto {
  @IsObject()
  input!: Record<string, unknown>;
}
