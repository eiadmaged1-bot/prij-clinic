import { BadRequestException } from "@nestjs/common";

const dayMs = 24 * 60 * 60 * 1000;
const pregnancyDurationDays = 280;

export function parseDateOnly(value: string | undefined, fieldName: string) {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Invalid ${fieldName}.`);
  }
  return date;
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * dayMs);
}

export function diffDays(later: Date, earlier: Date) {
  return Math.round((dateOnly(later).getTime() - dateOnly(earlier).getTime()) / dayMs);
}

export function dateOnly(date: Date) {
  return new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

export function gaDaysFromEdd(edd: Date, onDate = new Date()) {
  return pregnancyDurationDays - diffDays(edd, onDate);
}

export function eddFromGaOnDate(assessmentDate: Date, gaWeeks: number, gaDays: number) {
  const totalGaDays = gaWeeks * 7 + gaDays;
  return addDays(assessmentDate, pregnancyDurationDays - totalGaDays);
}

export function splitGa(totalDays: number) {
  return {
    totalDays,
    weeks: Math.floor(totalDays / 7),
    days: totalDays % 7,
    display: `${Math.floor(totalDays / 7)}w ${totalDays % 7}d`
  };
}
