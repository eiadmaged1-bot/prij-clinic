export const patientTypeOptions = [
  { value: "OB", label: "Obstetric" },
  { value: "GYN", label: "Gynecology" },
  { value: "INFERTILITY", label: "Infertility" },
  { value: "WOMEN_HEALTH", label: "Women's Health" },
  { value: "GENERAL", label: "General" }
];

export function patientTypeLabel(value?: string | null) {
  return patientTypeOptions.find((option) => option.value === value)?.label ?? "Not set";
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

export function ageLabel(dateOfBirth?: string | null) {
  if (!dateOfBirth) return "Age not set";
  const year = Number(dateOfBirth.slice(0, 4));
  if (!year) return "Age not set";
  return `${new Date().getFullYear() - year} years`;
}
