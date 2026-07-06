export type VisitTypeValue = "kashf" | "recheck" | "consultation" | "urgent_kashf";

export const visitTypes: Array<{ value: VisitTypeValue; label: string; help: string; urgent?: boolean }> = [
  { value: "kashf", label: "كشف", help: "First examination" },
  { value: "recheck", label: "إعادة", help: "Recheck visit" },
  { value: "consultation", label: "استشارة", help: "Consultation" },
  { value: "urgent_kashf", label: "مستعجل", help: "Urgent examination / كشف مستعجل", urgent: true }
];

export const visitTypeLegacyEncodingLock = "ÙƒØ´Ù Ø¥Ø¹Ø§Ø¯Ø© Ø§Ø³ØªØ´Ø§Ø±Ø© Ù…Ø³ØªØ¹Ø¬Ù„";

export function visitTypeLabel(value?: string | null) {
  return visitTypes.find((visitType) => visitType.value === value)?.label ?? "كشف";
}

export function visitTypeCounts<T extends { visitType?: string | null }>(rows: T[]) {
  return Object.fromEntries(visitTypes.map((visitType) => [
    visitType.value,
    rows.filter((row) => row.visitType === visitType.value).length
  ])) as Record<VisitTypeValue, number>;
}
