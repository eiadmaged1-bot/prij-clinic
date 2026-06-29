const verifiedLimitations = [
  "Clinical calculation support only; clinician review is required.",
  "Inputs must be checked for correct units before use.",
  "This system does not diagnose, prescribe, or replace doctor judgment."
];

const unverifiedLimitations = [
  "Formula exists in catalog but is not verified for clinical use yet.",
  "Measurement recording may be stored when safe.",
  "No clinical interpretation, percentile, diagnosis, or fetal growth restriction assessment is generated."
];

const generalSource = {
  sourceName: "Standard clinical arithmetic formula",
  sourceVersion: "local-handler-v1"
};

const formulas = [
  formula("OB_EDD_FROM_LMP", "EDD from LMP", "OB Dating", "obstetrics", "handler", "verified", {
    sourceName: "Naegele rule",
    sourceYear: 1812,
    sourceVersion: "local-handler-v1",
    inputs: [["lmpDate", "date"]],
    outputs: [["edd", "date"], ["gestationalAgeToday", "days"]]
  }),
  formula("OB_EDD_FROM_LMP_CYCLE_LENGTH", "EDD from LMP and cycle length", "OB Dating", "obstetrics", "handler", "verified", {
    sourceName: "Naegele rule with cycle length adjustment",
    sourceVersion: "local-handler-v1",
    inputs: [["lmpDate", "date"], ["cycleLengthDays", "days"]],
    outputs: [["edd", "date"], ["cycleAdjustmentDays", "days"]]
  }),
  formula("OB_EDD_FROM_CONCEPTION_DATE", "EDD from conception date", "OB Dating", "obstetrics", "handler", "verified", {
    sourceName: "Standard obstetric dating interval",
    sourceVersion: "local-handler-v1",
    inputs: [["conceptionDate", "date"]],
    outputs: [["edd", "date"]]
  }),
  formula("OB_EDD_FROM_KNOWN_EDD", "Known EDD dating", "OB Dating", "obstetrics", "handler", "verified", {
    ...generalSource,
    inputs: [["knownEdd", "date"]],
    outputs: [["edd", "date"], ["gestationalAgeToday", "days"]]
  }),
  formula("OB_EDD_FROM_GA_ON_DATE", "EDD from GA on known date", "OB Dating", "obstetrics", "handler", "verified", {
    ...generalSource,
    inputs: [["assessmentDate", "date"], ["gaWeeks", "weeks"], ["gaDays", "days"]],
    outputs: [["edd", "date"]]
  }),
  formula("OB_EDD_FROM_ULTRASOUND_GA_ON_DATE", "EDD from ultrasound GA on scan date", "OB Dating", "obstetrics", "handler", "verified", {
    sourceName: "Ultrasound GA date arithmetic only",
    sourceVersion: "local-handler-v1",
    inputs: [["scanDate", "date"], ["gaWeeks", "weeks"], ["gaDays", "days"]],
    outputs: [["edd", "date"]]
  }),
  formula("OB_CURRENT_GA_FROM_EDD", "Current GA from EDD", "OB Dating", "obstetrics", "handler", "verified", {
    ...generalSource,
    inputs: [["edd", "date"], ["onDate", "date"]],
    outputs: [["gestationalAge", "days"]]
  }),
  formula("BMI", "Body Mass Index", "General Medical", "general", "handler", "verified", {
    sourceName: "WHO BMI arithmetic definition",
    sourceVersion: "local-handler-v1",
    inputs: [["weightKg", "kg"], ["heightCm", "cm"]],
    outputs: [["bmi", "kg/m2"]]
  }),
  formula("BSA_MOSTELLER", "Body Surface Area, Mosteller", "General Medical", "general", "handler", "verified", {
    sourceName: "Mosteller RD. Simplified calculation of body-surface area.",
    sourceYear: 1987,
    sourceVersion: "local-handler-v1",
    inputs: [["weightKg", "kg"], ["heightCm", "cm"]],
    outputs: [["bsa", "m2"]]
  }),
  formula("CORRECTED_CALCIUM", "Corrected Calcium", "Electrolytes", "general", "handler", "verified", {
    ...generalSource,
    inputs: [["calciumMgDl", "mg/dL"], ["albuminGdl", "g/dL"]],
    outputs: [["correctedCalciumMgDl", "mg/dL"]]
  }),
  formula("ANION_GAP", "Anion Gap", "Electrolytes", "general", "handler", "verified", {
    ...generalSource,
    inputs: [["sodiumMmolL", "mmol/L"], ["chlorideMmolL", "mmol/L"], ["bicarbonateMmolL", "mmol/L"]],
    outputs: [["anionGapMmolL", "mmol/L"]]
  }),
  formula("SERUM_OSMOLALITY", "Calculated Serum Osmolality", "Electrolytes", "general", "handler", "verified", {
    ...generalSource,
    inputs: [["sodiumMmolL", "mmol/L"], ["glucoseMgDl", "mg/dL"], ["bunMgDl", "mg/dL"]],
    outputs: [["osmolalityMOsmKg", "mOsm/kg"]]
  }),
  formula("EGFR_CKD_EPI_2021_CREATININE", "eGFR CKD-EPI 2021 Creatinine", "Renal", "general", "handler", "verified", {
    sourceName: "CKD-EPI 2021 creatinine equation",
    sourceYear: 2021,
    sourceVersion: "local-handler-v1",
    inputs: [["sex", "female/male"], ["ageYears", "years"], ["serumCreatinineMgDl", "mg/dL"]],
    outputs: [["egfrMlMin173m2", "mL/min/1.73m2"]]
  }),
  formula("CREATININE_CLEARANCE_COCKCROFT_GAULT", "Creatinine Clearance, Cockcroft-Gault", "Renal", "general", "handler", "verified", {
    sourceName: "Cockcroft-Gault creatinine clearance equation",
    sourceYear: 1976,
    sourceVersion: "local-handler-v1",
    inputs: [["sex", "female/male"], ["ageYears", "years"], ["weightKg", "kg"], ["serumCreatinineMgDl", "mg/dL"]],
    outputs: [["creatinineClearanceMlMin", "mL/min"]]
  }),
  draft("CRL_TO_GA", "CRL to GA", "OB Ultrasound", "obstetrics"),
  draft("BPD_TO_GA", "BPD to GA", "OB Ultrasound", "obstetrics"),
  draft("HC_TO_GA", "HC to GA", "OB Ultrasound", "obstetrics"),
  draft("AC_TO_GA", "AC to GA", "OB Ultrasound", "obstetrics"),
  draft("FL_TO_GA", "FL to GA", "OB Ultrasound", "obstetrics"),
  draft("HADLOCK_EFW", "Hadlock EFW", "OB Ultrasound", "obstetrics"),
  draft("FETAL_GROWTH_PERCENTILE", "Fetal growth percentile", "OB Ultrasound", "obstetrics"),
  draft("AFI_ASSESSMENT", "AFI assessment", "OB Ultrasound", "obstetrics"),
  draft("SDP_ASSESSMENT", "Single deepest pocket assessment", "OB Ultrasound", "obstetrics"),
  draft("UMBILICAL_ARTERY_DOPPLER_PERCENTILE", "Umbilical artery Doppler percentile", "OB Ultrasound", "obstetrics"),
  draft("MCA_DOPPLER_PERCENTILE", "MCA Doppler percentile", "OB Ultrasound", "obstetrics"),
  catalog("PREGNANCY_WEIGHT_GAIN_TRACKER", "Pregnancy weight gain tracker", "Maternal / Pregnancy", "obstetrics"),
  catalog("BP_TREND_PREGNANCY", "Pregnancy BP trend tracker", "Maternal / Pregnancy", "obstetrics"),
  catalog("ANEMIA_PREGNANCY_NOTE", "Pregnancy anemia note", "Maternal / Pregnancy", "obstetrics"),
  catalog("GDM_TRACKER", "GDM tracker", "Maternal / Pregnancy", "obstetrics"),
  catalog("CORRECTED_SODIUM_HYPERGLYCEMIA", "Corrected sodium in hyperglycemia", "Electrolytes", "general"),
  catalog("MAP", "Mean arterial pressure", "General Medical", "general"),
  formula("MENSTRUAL_CYCLE_INTERVAL", "Menstrual cycle interval", "Gynecology", "gynecology", "handler", "verified", {
    ...generalSource,
    inputs: [["cycleStartDate", "date"], ["nextCycleStartDate", "date"]],
    outputs: [["intervalDays", "days"]]
  }),
  formula("INFERTILITY_DURATION", "Infertility duration", "Gynecology", "gynecology", "handler", "verified", {
    ...generalSource,
    inputs: [["tryingSinceDate", "date"], ["assessmentDate", "date"]],
    outputs: [["durationMonths", "months"]]
  }),
  catalog("FOLLICULAR_MONITORING_INTERVAL", "Follicular monitoring interval", "Gynecology", "gynecology")
];

async function seedCalculatorFormulas(prisma) {
  for (const item of formulas) {
    await prisma.calculatorFormula.upsert({
      where: { code: item.code },
      update: item,
      create: item
    });
  }
}

function formula(code, name, category, specialty, engineType, status, options) {
  const inputs = Object.fromEntries((options.inputs ?? []).map(([key, unit]) => [key, { unit, required: true }]));
  const outputs = Object.fromEntries((options.outputs ?? []).map(([key, unit]) => [key, { unit }]));
  return {
    code,
    name,
    category,
    specialty,
    formulaType: category.includes("OB") ? "obstetric" : "general",
    calculationEngineType: engineType,
    implementationStatus: status,
    sourceName: options.sourceName,
    sourceYear: options.sourceYear ?? null,
    sourceVersion: options.sourceVersion ?? null,
    sourceUrl: options.sourceUrl ?? null,
    inputSchemaJson: { fields: inputs },
    outputSchemaJson: { fields: outputs },
    formulaJson: { handler: code },
    unitRulesJson: { inputs, outputs },
    limitationsJson: { warnings: verifiedLimitations },
    active: true
  };
}

function draft(code, name, category, specialty) {
  return unverified(code, name, category, specialty, "draft");
}

function catalog(code, name, category, specialty) {
  return unverified(code, name, category, specialty, "catalog_only");
}

function unverified(code, name, category, specialty, status) {
  return {
    code,
    name,
    category,
    specialty,
    formulaType: category.includes("OB") ? "obstetric" : "general",
    calculationEngineType: "catalog_only",
    implementationStatus: status,
    sourceName: "Pending clinical formula governance review",
    sourceYear: null,
    sourceVersion: "catalog-entry-v1",
    sourceUrl: null,
    inputSchemaJson: { fields: {} },
    outputSchemaJson: { fields: {} },
    formulaJson: { handler: null, verifiedImplementation: false },
    unitRulesJson: null,
    limitationsJson: { warnings: unverifiedLimitations },
    active: true
  };
}

module.exports = { seedCalculatorFormulas };
