export type CanonicalPatientType =
  | "OBSTETRIC"
  | "HIGH_RISK_OBSTETRIC"
  | "GYNECOLOGY"
  | "INFERTILITY"
  | "POSTPARTUM"
  | "PREVENTIVE_WELL_WOMAN"
  | "OTHER";

export const patientTypeOptions: Array<{ value: CanonicalPatientType; label: string; labelAr: string }> = [
  { value: "OBSTETRIC", label: "Obstetric / Pregnancy", labelAr: "حمل ومتابعة ولادة" },
  { value: "HIGH_RISK_OBSTETRIC", label: "High-risk obstetric", labelAr: "حمل عالي الخطورة" },
  { value: "GYNECOLOGY", label: "Gynecology", labelAr: "أمراض النساء" },
  { value: "INFERTILITY", label: "Infertility / Fertility", labelAr: "تأخر الإنجاب والخصوبة" },
  { value: "POSTPARTUM", label: "Postpartum", labelAr: "ما بعد الولادة" },
  { value: "PREVENTIVE_WELL_WOMAN", label: "Preventive / Well-woman", labelAr: "صحة المرأة والوقاية" },
  { value: "OTHER", label: "Other", labelAr: "أخرى" }
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
  GYN: "GYNECOLOGY",
  WOMEN_HEALTH: "PREVENTIVE_WELL_WOMAN",
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
  const dateYear = dateOfBirth ? Number(dateOfBirth.slice(0, 4)) : 0;
  const fallbackYear = Number(yearOfBirth ?? 0);
  const year = dateYear || fallbackYear;
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(year) || year < 1900 || year > currentYear) return "Age not set";
  return `${currentYear - year} years`;
}
