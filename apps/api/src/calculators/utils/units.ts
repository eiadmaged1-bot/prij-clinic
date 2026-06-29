import { BadRequestException } from "@nestjs/common";

export function finiteNumber(value: unknown, fieldName: string) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new BadRequestException(`${fieldName} must be a valid number.`);
  }
  return numberValue;
}

export function positiveNumber(value: unknown, fieldName: string) {
  const numberValue = finiteNumber(value, fieldName);
  if (numberValue <= 0) {
    throw new BadRequestException(`${fieldName} must be greater than zero.`);
  }
  return numberValue;
}

export function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
