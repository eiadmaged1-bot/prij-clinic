export type EddMode = "manual" | "calculated";
export type EddSource = "MANUAL" | "LMP" | "ULTRASOUND" | "IVF_ET" | "KNOWN_CONCEPTION";

export type EddCandidate = {
  mode: EddMode;
  source: EddSource;
  sourceDate: string;
  edd: string;
  formula: string;
};

export type EddHistoryEntry = {
  edd: string;
  datingMethod?: string;
  datingSourceDate?: string;
  datingConfirmationDate?: string;
  datingClinician?: string;
  replacedAt: string;
  replacedBy: string;
  correctionReason: string;
};

export type EddConfirmation = {
  edd: string;
  eddMode: EddMode;
  datingMethod: EddSource;
  datingSourceDate: string;
  datingFormula: string;
  datingConfirmationDate: string;
  datingClinician: string;
  datingCorrectionReason?: string;
  datingHistory: EddHistoryEntry[];
};

export type EddCandidateInput =
  | { mode: "manual"; source: "MANUAL"; manualEdd: string; sourceDate?: string }
  | { mode: "calculated"; source: "LMP"; lmpDate: string }
  | { mode: "calculated"; source: "KNOWN_CONCEPTION"; conceptionDate: string }
  | { mode: "calculated"; source: "IVF_ET"; transferDate: string; embryoAgeDays: 3 | 5 }
  | {
      mode: "calculated";
      source: "ULTRASOUND";
      scanDate: string;
      ultrasoundEdd?: string;
      gestationalWeeks?: number;
      gestationalDays?: number;
    };

export function calculateEddCandidate(input: EddCandidateInput): EddCandidate {
  if (input.mode === "manual") {
    const edd = requireIsoDate(input.manualEdd, "manual EDD");
    return {
      mode: "manual",
      source: "MANUAL",
      sourceDate: requireIsoDate(input.sourceDate ?? input.manualEdd, "manual source date"),
      edd,
      formula: "MANUAL_CLINICIAN_ENTRY"
    };
  }

  if (input.source === "LMP") {
    const sourceDate = requireIsoDate(input.lmpDate, "LMP date");
    return { mode: "calculated", source: "LMP", sourceDate, edd: addDateOnlyDays(sourceDate, 280), formula: "LMP+280d" };
  }

  if (input.source === "KNOWN_CONCEPTION") {
    const sourceDate = requireIsoDate(input.conceptionDate, "known conception date");
    return {
      mode: "calculated",
      source: "KNOWN_CONCEPTION",
      sourceDate,
      edd: addDateOnlyDays(sourceDate, 266),
      formula: "CONCEPTION+266d"
    };
  }

  if (input.source === "IVF_ET") {
    const sourceDate = requireIsoDate(input.transferDate, "embryo transfer date");
    if (input.embryoAgeDays !== 3 && input.embryoAgeDays !== 5) {
      throw new Error("IVF embryo age must be day 3 or day 5.");
    }
    const offset = 266 - input.embryoAgeDays;
    return {
      mode: "calculated",
      source: "IVF_ET",
      sourceDate,
      edd: addDateOnlyDays(sourceDate, offset),
      formula: `IVF_ET_DAY_${input.embryoAgeDays}+${offset}d`
    };
  }

  const sourceDate = requireIsoDate(input.scanDate, "ultrasound scan date");
  if (input.ultrasoundEdd) {
    return {
      mode: "calculated",
      source: "ULTRASOUND",
      sourceDate,
      edd: requireIsoDate(input.ultrasoundEdd, "ultrasound EDD"),
      formula: "ULTRASOUND_EXPLICIT_EDD"
    };
  }

  const weeks = input.gestationalWeeks;
  const days = input.gestationalDays;
  if (!Number.isInteger(weeks) || !Number.isInteger(days) || Number(weeks) < 0 || Number(days) < 0 || Number(days) > 6) {
    throw new Error("Ultrasound dating requires an explicit ultrasound EDD or complete gestational weeks and days.");
  }
  const gestationalAgeDays = Number(weeks) * 7 + Number(days);
  if (gestationalAgeDays > 280) {
    throw new Error("Ultrasound gestational age cannot exceed 280 days for EDD calculation.");
  }
  return {
    mode: "calculated",
    source: "ULTRASOUND",
    sourceDate,
    edd: addDateOnlyDays(sourceDate, 280 - gestationalAgeDays),
    formula: "ULTRASOUND_SCAN_GA_TO_280d"
  };
}

export function confirmEddCandidate({
  candidate,
  current,
  clinician,
  confirmationDate,
  replaceConfirmed = false,
  correctionReason
}: {
  candidate: EddCandidate;
  current?: Partial<EddConfirmation> | null;
  clinician: string;
  confirmationDate: string;
  replaceConfirmed?: boolean;
  correctionReason?: string;
}): EddConfirmation {
  const confirmedBy = clinician.trim();
  if (!confirmedBy) throw new Error("Dating clinician is required to confirm an authoritative EDD.");
  const confirmedAt = requireIsoDate(confirmationDate, "EDD confirmation date");
  const currentEdd = current?.edd ? requireIsoDate(current.edd, "current confirmed EDD") : "";
  const changesConfirmedEdd = Boolean(currentEdd && currentEdd !== candidate.edd);
  const reason = correctionReason?.trim() ?? "";

  if (changesConfirmedEdd && !replaceConfirmed) {
    throw new Error("Explicit replace confirmation is required before changing a confirmed EDD.");
  }
  if (changesConfirmedEdd && !reason) {
    throw new Error("A correction reason is required before replacing a confirmed EDD.");
  }

  const datingHistory = Array.isArray(current?.datingHistory) ? current.datingHistory.map((entry) => ({ ...entry })) : [];
  if (changesConfirmedEdd) {
    datingHistory.push({
      edd: currentEdd,
      datingMethod: current?.datingMethod,
      datingSourceDate: current?.datingSourceDate,
      datingConfirmationDate: current?.datingConfirmationDate,
      datingClinician: current?.datingClinician,
      replacedAt: confirmedAt,
      replacedBy: confirmedBy,
      correctionReason: reason
    });
  }

  return {
    edd: candidate.edd,
    eddMode: candidate.mode,
    datingMethod: candidate.source,
    datingSourceDate: candidate.sourceDate,
    datingFormula: candidate.formula,
    datingConfirmationDate: confirmedAt,
    datingClinician: confirmedBy,
    ...(reason ? { datingCorrectionReason: reason } : {}),
    datingHistory
  };
}

export function isPregnancyMenstrualUiSuppressed(context: string | null | undefined) {
  return String(context ?? "").trim().toLowerCase() === "pregnancy";
}

function addDateOnlyDays(value: string, days: number) {
  const date = parseIsoDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function requireIsoDate(value: string, label: string) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  const date = parseIsoDate(trimmed);
  const normalized = date.toISOString().slice(0, 10);
  if (normalized !== trimmed) throw new Error(`${label} must be a valid ISO date-only value.`);
  return normalized;
}

function parseIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Date must use YYYY-MM-DD format.");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date.");
  return date;
}

export function derivePregnancyDisplay(eddValue: string, todayValue = new Date().toISOString().slice(0, 10)) {
  const edd = parseIsoDate(requireIsoDate(eddValue, "EDD"));
  const today = parseIsoDate(requireIsoDate(todayValue, "current date"));
  const daysRemaining = Math.ceil((edd.getTime() - today.getTime()) / 86400000);
  const gestationalDays = 280 - daysRemaining;
  const weeks = Math.max(0, Math.floor(gestationalDays / 7));
  const days = Math.max(0, gestationalDays % 7);
  const trimester = gestationalDays < 98 ? 1 : gestationalDays < 196 ? 2 : 3;
  return { gestationalDays, weeks, days, display: `${weeks}w ${days}d`, trimester, daysRemaining };
}
