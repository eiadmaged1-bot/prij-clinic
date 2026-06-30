export function scoreOfficialRow(row: Record<string, unknown>) {
  const keys = ["tradeName", "Trade Name", "genericName", "Generic Name", "strengthText", "Strength", "dosageForm", "Dosage Form", "registrationNumber", "Registration Number", "Price"];
  const present = keys.filter((key) => String(row[key] ?? "").trim()).length;
  return Math.min(0.99, 0.35 + present * 0.06);
}
