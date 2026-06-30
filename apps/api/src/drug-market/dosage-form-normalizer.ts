const forms = ["tablet", "capsule", "syrup", "oral suspension", "vial", "ampoule", "injection", "drops", "cream", "ointment", "gel", "suppository", "inhaler", "solution", "sachet", "powder", "patch", "spray"];

export function normalizeDosageForm(value: string | null | undefined) {
  const text = String(value ?? "").toLowerCase().trim();
  return forms.find((form) => text.includes(form)) ?? (text || null);
}
