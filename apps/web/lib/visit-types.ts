export type VisitTypeValue = "kashf" | "recheck" | "consultation" | "urgent_kashf";

export const visitTypes: Array<{ value: VisitTypeValue; label: string; urgent?: boolean }> = [
  { value: "consultation", label: "استشارة" },
  { value: "kashf", label: "كشف" },
  { value: "recheck", label: "إعادة" },
  { value: "urgent_kashf", label: "مستعجل", urgent: true }
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
