import { BadRequestException, Injectable } from "@nestjs/common";
import type { FormulaVersion } from "@prisma/client";

type InputField = {
  name: string;
  label?: string;
  type: "number" | "select";
  unit?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: string[];
  observedAtField?: string;
  staleAfterHours?: number;
};

type FormulaTestCase = { input: Record<string, unknown>; expected: number; tolerance?: number };

@Injectable()
export class MedicationFormulaEngineService {
  calculate(version: FormulaVersion, rawInput: Record<string, unknown>) {
    if (version.approvalStatus !== "approved" || !version.reviewerUserId) {
      throw new BadRequestException("This formula version is not approved for clinical calculation support.");
    }

    const fields = parseFields(version.inputSchemaJson);
    const input = validateInput(fields, rawInput, version.validRangeJson);
    this.verifyLockedTestCases(version, fields);
    const preRoundingValue = runVerifiedHandler(version.expression, input);
    const finalValue = applyRounding(preRoundingValue, version.roundingMethod);
    return {
      preRoundingValue,
      finalValue,
      formulaDisplay: displayFormula(version.expression),
      warnings: staleWarnings(fields, rawInput)
    };
  }

  private verifyLockedTestCases(version: FormulaVersion, fields: InputField[]) {
    const cases = Array.isArray(version.testCasesJson) ? version.testCasesJson as unknown as FormulaTestCase[] : [];
    if (!cases.length) throw new BadRequestException("Approved formula is missing locked validation test cases.");
    for (const testCase of cases) {
      if (!testCase || typeof testCase !== "object" || !Number.isFinite(testCase.expected)) {
        throw new BadRequestException("Approved formula has an invalid locked test case.");
      }
      const input = validateInput(fields, testCase.input, version.validRangeJson);
      const actual = applyRounding(runVerifiedHandler(version.expression, input), version.roundingMethod);
      if (Math.abs(actual - testCase.expected) > (testCase.tolerance ?? 0.000001)) {
        throw new BadRequestException("Approved formula failed its locked validation test cases.");
      }
    }
  }
}

function displayFormula(handler: string) {
  const formulas: Record<string, string> = {
    WEIGHT_BASED_PRODUCT: "weightKg × dosePerKg",
    BSA_MOSTELLER: "√((heightCm × weightKg) ÷ 3600)",
    IDEAL_BODY_WEIGHT_DEVINE: "baseSexValue + 2.3 × max(0, heightInches − 60)",
    ADJUSTED_BODY_WEIGHT: "idealBodyWeightKg + adjustmentFactor × (actualBodyWeightKg − idealBodyWeightKg)",
    CREATININE_CLEARANCE_COCKCROFT_GAULT: "((140 − ageYears) × weightKg ÷ (72 × serumCreatinineMgDl)) × sexFactor",
    INFUSION_RATE_ML_H: "volumeMl ÷ durationHours",
    MAXIMUM_DOSE_CHECK: "min(calculatedDose, maximumDose)"
  };
  return formulas[handler] ?? handler;
}

function parseFields(value: unknown): InputField[] {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const rawFields = Array.isArray(record.fields) ? record.fields : [];
  const fields = rawFields.filter((item): item is InputField => Boolean(item && typeof item === "object" && typeof (item as InputField).name === "string" && ["number", "select"].includes((item as InputField).type)));
  if (!fields.length || new Set(fields.map((field) => field.name)).size !== fields.length) {
    throw new BadRequestException("Approved formula has an invalid input schema.");
  }
  return fields;
}

function validateInput(fields: InputField[], rawInput: Record<string, unknown>, rangeJson: unknown) {
  const allowed = new Set(fields.flatMap((field) => [field.name, field.observedAtField].filter(Boolean) as string[]));
  const unknown = Object.keys(rawInput).filter((key) => !allowed.has(key));
  if (unknown.length) throw new BadRequestException(`Unexpected formula input: ${unknown.join(", ")}.`);
  const ranges = rangeJson && typeof rangeJson === "object" && !Array.isArray(rangeJson) ? rangeJson as Record<string, { min?: number; max?: number }> : {};
  const input: Record<string, number | string> = {};
  for (const field of fields) {
    const value = rawInput[field.name];
    if (value === undefined || value === null || value === "") {
      if (field.required !== false) throw new BadRequestException(`${field.label ?? field.name} is required; missing values are never inferred.`);
      continue;
    }
    if (field.type === "select") {
      const normalized = String(value).toLowerCase();
      if (!field.options?.map((item) => item.toLowerCase()).includes(normalized)) throw new BadRequestException(`${field.label ?? field.name} is invalid.`);
      input[field.name] = normalized;
      continue;
    }
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) throw new BadRequestException(`${field.label ?? field.name} must be a finite number.`);
    const min = field.min ?? ranges[field.name]?.min;
    const max = field.max ?? ranges[field.name]?.max;
    if (min !== undefined && number < min || max !== undefined && number > max) throw new BadRequestException(`${field.label ?? field.name} is outside the approved range.`);
    input[field.name] = number;
  }
  return input;
}

function number(input: Record<string, number | string>, key: string) {
  const value = input[key];
  if (typeof value !== "number" || !Number.isFinite(value)) throw new BadRequestException(`${key} is required.`);
  return value;
}

function runVerifiedHandler(handler: string, input: Record<string, number | string>) {
  if (handler === "WEIGHT_BASED_PRODUCT") return number(input, "weightKg") * number(input, "dosePerKg");
  if (handler === "BSA_MOSTELLER") return Math.sqrt(number(input, "heightCm") * number(input, "weightKg") / 3600);
  if (handler === "IDEAL_BODY_WEIGHT_DEVINE") {
    const base = input.sex === "female" ? 45.5 : input.sex === "male" ? 50 : NaN;
    if (!Number.isFinite(base)) throw new BadRequestException("sex must be female or male for this approved equation.");
    return base + 2.3 * Math.max(0, number(input, "heightInches") - 60);
  }
  if (handler === "ADJUSTED_BODY_WEIGHT") return number(input, "idealBodyWeightKg") + number(input, "adjustmentFactor") * (number(input, "actualBodyWeightKg") - number(input, "idealBodyWeightKg"));
  if (handler === "CREATININE_CLEARANCE_COCKCROFT_GAULT") {
    const factor = input.sex === "female" ? 0.85 : input.sex === "male" ? 1 : NaN;
    if (!Number.isFinite(factor)) throw new BadRequestException("sex must be female or male for this approved equation.");
    return ((140 - number(input, "ageYears")) * number(input, "weightKg") / (72 * number(input, "serumCreatinineMgDl"))) * factor;
  }
  if (handler === "INFUSION_RATE_ML_H") return number(input, "volumeMl") / number(input, "durationHours");
  if (handler === "MAXIMUM_DOSE_CHECK") return Math.min(number(input, "calculatedDose"), number(input, "maximumDose"));
  throw new BadRequestException("This formula does not use a supported verified handler.");
}

function applyRounding(value: number, method: string) {
  if (!Number.isFinite(value)) throw new BadRequestException("Formula produced an invalid result.");
  if (method === "none") return value;
  if (method === "nearest_integer") return Math.round(value);
  const decimals = /^decimal:(\d)$/.exec(method);
  if (decimals) return Number(value.toFixed(Number(decimals[1])));
  const increment = /^increment:(\d+(?:\.\d+)?)$/.exec(method);
  if (increment) { const step = Number(increment[1]); return Math.round(value / step) * step; }
  throw new BadRequestException("Approved formula has an unsupported rounding method.");
}

function staleWarnings(fields: InputField[], rawInput: Record<string, unknown>) {
  const warnings: string[] = [];
  for (const field of fields) {
    if (!field.observedAtField || !field.staleAfterHours) continue;
    const observedAt = new Date(String(rawInput[field.observedAtField] ?? ""));
    if (!Number.isFinite(observedAt.getTime())) warnings.push(`${field.label ?? field.name}: observation time is missing or invalid.`);
    else if (Date.now() - observedAt.getTime() > field.staleAfterHours * 3_600_000) warnings.push(`${field.label ?? field.name}: source value may be stale; verify the current result.`);
  }
  return warnings;
}
