export type CanonicalPatientType =
  | "OBSTETRIC"
  | "HIGH_RISK_OBSTETRIC"
  | "GYNECOLOGY"
  | "INFERTILITY"
  | "POSTPARTUM"
  | "PREVENTIVE_WELL_WOMAN"
  | "OTHER";

export const patientTypeOptions: Array<{ value: CanonicalPatientType; label: string; labelAr: string }> = [
  { value: "OBSTETRIC", label: "Pregnancy / Obstetric", labelAr: "الحمل / التوليد" },
  { value: "GYNECOLOGY", label: "Gynecology", labelAr: "أمراض النساء" },
  { value: "INFERTILITY", label: "Fertility", labelAr: "الخصوبة" },
  { value: "OTHER", label: "Undetermined", labelAr: "غير محدد بعد" }
];

export type PatientCreationContext = "OBSTETRIC" | "GYNECOLOGY" | "INFERTILITY" | "OTHER";

export const patientCreationContextOptions: Array<{ value: PatientCreationContext; label: string; labelAr: string }> = [
  { value: "OBSTETRIC", label: "Pregnancy / Obstetric", labelAr: "الحمل / التوليد" },
  { value: "GYNECOLOGY", label: "Gynecology", labelAr: "أمراض النساء" },
  { value: "INFERTILITY", label: "Fertility", labelAr: "الخصوبة" },
  { value: "OTHER", label: "Undetermined", labelAr: "غير محدد بعد" }
];

const legacyPatientTypeMap: Record<string, CanonicalPatientType> = {
  OB: "OBSTETRIC",
  PREGNANCY: "OBSTETRIC",
  HIGH_RISK_OBSTETRIC: "OBSTETRIC",
  POSTPARTUM: "OBSTETRIC",
  GYN: "GYNECOLOGY",
  WOMEN_HEALTH: "GYNECOLOGY",
  PREVENTIVE_WELL_WOMAN: "GYNECOLOGY",
  FERTILITY: "INFERTILITY",
  GENERAL: "OTHER"
};

export function normalizePatientType(value?: string | null): CanonicalPatientType {
  const key = String(value ?? "").trim().toUpperCase();
  if (patientTypeOptions.some((option) => option.value === key)) return key as CanonicalPatientType;
  return legacyPatientTypeMap[key] ?? "OTHER";
}

export function patientTypeLabel(value?: string | null, language: "en" | "ar" = "en") {
  const option = patientTypeOptions.find((item) => item.value === normalizePatientType(value))!;
  return language === "ar" ? option.labelAr : option.label;
}

export function patientTypeSemanticClass(value?: string | null) {
  return `patient-type-${normalizePatientType(value).toLowerCase().replaceAll("_", "-")}`;
}

export function phaseTypeLabel(value?: string | null) {
  const labels: Record<string, string> = {
    infertility: "Infertility",
    pregnancy: "Pregnancy",
    gynecology: "Gynecology",
    postpartum: "Postpartum",
    general: "General",
    other: "Other"
  };
  return labels[String(value ?? "")] ?? "No active phase";
}

export function ageLabel(dateOfBirth?: string | null, yearOfBirth?: number | string | null) {
  const now = new Date();
  if (dateOfBirth) {
    const dob = new Date(`${dateOfBirth.slice(0, 10)}T00:00:00.000Z`);
    if (!Number.isNaN(dob.getTime())) {
      let age = now.getUTCFullYear() - dob.getUTCFullYear();
      if (now.getUTCMonth() < dob.getUTCMonth() || (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate())) age -= 1;
      return `${Math.max(age, 0)} years`;
    }
  }
  const year = Number(yearOfBirth ?? 0);
  if (!Number.isInteger(year) || year < 1900 || year > now.getUTCFullYear()) return "Age not set";
  return `${now.getUTCFullYear() - year} years`;
}
