import { BadRequestException, Injectable } from "@nestjs/common";
import type { CalculatorFormula } from "@prisma/client";
import { addDays, eddFromGaOnDate, gaDaysFromEdd, parseDateOnly, splitGa } from "./utils/date-gestational-age";
import { finiteNumber, positiveNumber, round } from "./utils/units";

type CalculationResult = {
  output: Record<string, unknown>;
  units: Record<string, string>;
  limitations: string[];
};

@Injectable()
export class FormulaEngineService {
  calculate(formula: CalculatorFormula, input: Record<string, unknown>): CalculationResult {
    if (!formula.active) {
      throw new BadRequestException("Formula is inactive.");
    }

    if (formula.implementationStatus !== "verified") {
      throw new BadRequestException("Formula exists in catalog but is not verified for clinical use yet.");
    }

    if (formula.calculationEngineType !== "handler") {
      throw new BadRequestException("Formula does not have a safe verified handler yet.");
    }

    const result = this.runHandler(formula.code, input);
    return {
      ...result,
      limitations: warnings(formula)
    };
  }

  private runHandler(code: string, input: Record<string, unknown>): Omit<CalculationResult, "limitations"> {
    if (code === "BMI") {
      const weightKg = positiveNumber(input.weightKg, "weightKg");
      const heightM = positiveNumber(input.heightCm, "heightCm") / 100;
      return { output: { bmi: round(weightKg / (heightM * heightM), 1) }, units: { weightKg: "kg", heightCm: "cm", bmi: "kg/m2" } };
    }

    if (code === "BSA_MOSTELLER") {
      const weightKg = positiveNumber(input.weightKg, "weightKg");
      const heightCm = positiveNumber(input.heightCm, "heightCm");
      return { output: { bsa: round(Math.sqrt((heightCm * weightKg) / 3600), 2) }, units: { weightKg: "kg", heightCm: "cm", bsa: "m2" } };
    }

    if (code === "CORRECTED_CALCIUM") {
      const calcium = finiteNumber(input.calciumMgDl, "calciumMgDl");
      const albumin = finiteNumber(input.albuminGdl, "albuminGdl");
      return { output: { correctedCalciumMgDl: round(calcium + 0.8 * (4 - albumin), 2) }, units: { calciumMgDl: "mg/dL", albuminGdl: "g/dL", correctedCalciumMgDl: "mg/dL" } };
    }

    if (code === "ANION_GAP") {
      const sodium = finiteNumber(input.sodiumMmolL, "sodiumMmolL");
      const chloride = finiteNumber(input.chlorideMmolL, "chlorideMmolL");
      const bicarbonate = finiteNumber(input.bicarbonateMmolL, "bicarbonateMmolL");
      return { output: { anionGapMmolL: round(sodium - (chloride + bicarbonate), 1) }, units: { sodiumMmolL: "mmol/L", chlorideMmolL: "mmol/L", bicarbonateMmolL: "mmol/L", anionGapMmolL: "mmol/L" } };
    }

    if (code === "SERUM_OSMOLALITY") {
      const sodium = finiteNumber(input.sodiumMmolL, "sodiumMmolL");
      const glucose = finiteNumber(input.glucoseMgDl, "glucoseMgDl");
      const bun = finiteNumber(input.bunMgDl, "bunMgDl");
      return { output: { osmolalityMOsmKg: round(2 * sodium + glucose / 18 + bun / 2.8, 1) }, units: { sodiumMmolL: "mmol/L", glucoseMgDl: "mg/dL", bunMgDl: "mg/dL", osmolalityMOsmKg: "mOsm/kg" } };
    }

    if (code === "EGFR_CKD_EPI_2021_CREATININE") {
      const sex = String(input.sex ?? "").toLowerCase();
      const age = positiveNumber(input.ageYears, "ageYears");
      const scr = positiveNumber(input.serumCreatinineMgDl, "serumCreatinineMgDl");
      if (!["female", "male"].includes(sex)) throw new BadRequestException("sex must be female or male.");
      const isFemale = sex === "female";
      const kappa = isFemale ? 0.7 : 0.9;
      const alpha = isFemale ? -0.241 : -0.302;
      const egfr = 142 * Math.min(scr / kappa, 1) ** alpha * Math.max(scr / kappa, 1) ** -1.2 * 0.9938 ** age * (isFemale ? 1.012 : 1);
      return { output: { egfrMlMin173m2: round(egfr, 1) }, units: { ageYears: "years", serumCreatinineMgDl: "mg/dL", egfrMlMin173m2: "mL/min/1.73m2" } };
    }

    if (code === "CREATININE_CLEARANCE_COCKCROFT_GAULT") {
      const sex = String(input.sex ?? "").toLowerCase();
      const age = positiveNumber(input.ageYears, "ageYears");
      const weight = positiveNumber(input.weightKg, "weightKg");
      const scr = positiveNumber(input.serumCreatinineMgDl, "serumCreatinineMgDl");
      if (!["female", "male"].includes(sex)) throw new BadRequestException("sex must be female or male.");
      const crcl = ((140 - age) * weight) / (72 * scr) * (sex === "female" ? 0.85 : 1);
      return { output: { creatinineClearanceMlMin: round(crcl, 1) }, units: { ageYears: "years", weightKg: "kg", serumCreatinineMgDl: "mg/dL", creatinineClearanceMlMin: "mL/min" } };
    }

    if (code === "MENSTRUAL_CYCLE_INTERVAL") {
      const start = parseDateOnly(String(input.cycleStartDate ?? ""), "cycleStartDate")!;
      const next = parseDateOnly(String(input.nextCycleStartDate ?? ""), "nextCycleStartDate")!;
      const days = Math.round((next.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
      if (days < 0) throw new BadRequestException("nextCycleStartDate must be after cycleStartDate.");
      return { output: { intervalDays: days }, units: { cycleStartDate: "date", nextCycleStartDate: "date", intervalDays: "days" } };
    }

    if (code === "INFERTILITY_DURATION") {
      const start = parseDateOnly(String(input.tryingSinceDate ?? ""), "tryingSinceDate")!;
      const assessment = parseDateOnly(String(input.assessmentDate ?? new Date().toISOString().slice(0, 10)), "assessmentDate")!;
      const months = Math.max(0, Math.floor((assessment.getTime() - start.getTime()) / (30.4375 * 24 * 60 * 60 * 1000)));
      return { output: { durationMonths: months }, units: { tryingSinceDate: "date", assessmentDate: "date", durationMonths: "months" } };
    }

    if (code.startsWith("OB_")) {
      return this.obArithmetic(code, input);
    }

    throw new BadRequestException("No verified handler exists for this formula.");
  }

  private obArithmetic(code: string, input: Record<string, unknown>): Omit<CalculationResult, "limitations"> {
    const today = parseDateOnly(String(input.onDate ?? new Date().toISOString().slice(0, 10)), "onDate")!;
    let edd: Date;

    if (code === "OB_EDD_FROM_LMP") {
      const lmp = parseDateOnly(String(input.lmpDate ?? ""), "lmpDate")!;
      edd = addDays(lmp, 280);
    } else if (code === "OB_EDD_FROM_LMP_CYCLE_LENGTH") {
      const lmp = parseDateOnly(String(input.lmpDate ?? ""), "lmpDate")!;
      const cycle = finiteNumber(input.cycleLengthDays, "cycleLengthDays");
      edd = addDays(lmp, 280 + (cycle - 28));
    } else if (code === "OB_EDD_FROM_CONCEPTION_DATE") {
      const conception = parseDateOnly(String(input.conceptionDate ?? ""), "conceptionDate")!;
      edd = addDays(conception, 266);
    } else if (code === "OB_EDD_FROM_KNOWN_EDD" || code === "OB_CURRENT_GA_FROM_EDD") {
      edd = parseDateOnly(String(input.knownEdd ?? input.edd ?? ""), "edd")!;
    } else if (code === "OB_EDD_FROM_GA_ON_DATE") {
      const assessment = parseDateOnly(String(input.assessmentDate ?? ""), "assessmentDate")!;
      edd = eddFromGaOnDate(assessment, finiteNumber(input.gaWeeks, "gaWeeks"), finiteNumber(input.gaDays, "gaDays"));
    } else if (code === "OB_EDD_FROM_ULTRASOUND_GA_ON_DATE") {
      const scanDate = parseDateOnly(String(input.scanDate ?? ""), "scanDate")!;
      edd = eddFromGaOnDate(scanDate, finiteNumber(input.gaWeeks, "gaWeeks"), finiteNumber(input.gaDays, "gaDays"));
    } else {
      throw new BadRequestException("No verified OB dating handler exists for this formula.");
    }

    const ga = splitGa(gaDaysFromEdd(edd, today));
    return {
      output: { edd: edd.toISOString().slice(0, 10), gestationalAgeToday: ga },
      units: { edd: "date", gestationalAgeToday: "weeks+days" }
    };
  }
}

function warnings(formula: CalculatorFormula) {
  const value = formula.limitationsJson as { warnings?: string[] } | null;
  return value?.warnings?.length ? value.warnings : ["Clinical calculation support only; doctor review is required."];
}
