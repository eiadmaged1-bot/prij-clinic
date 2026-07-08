export type VisitTypeValue = "kashf" | "recheck" | "consultation" | "urgent_kashf";

export const visitTypes: Array<{ value: VisitTypeValue; label: string; urgent?: boolean }> = [
  { value: "kashf", label: "كشف" },
  { value: "recheck", label: "إعادة" },
  { value: "consultation", label: "استشارة" },
  { value: "urgent_kashf", label: "مستعجل", urgent: true }
];

export const visitTypeLegacyEncodingLock = "كشف إعادة استشارة مستعجل";
export const visitTypeV140LegacyEncodingCompatibilityLock = "استشارة كشف إعادة مستعجل";

export function visitTypeLabel(value?: string | null) {
  return visitTypes.find((visitType) => visitType.value === value)?.label ?? "كشف";
}

export function visitTypeCounts<T extends { visitType?: string | null }>(rows: T[]) {
  return Object.fromEntries(visitTypes.map((visitType) => [
    visitType.value,
    rows.filter((row) => row.visitType === visitType.value).length
  ])) as Record<VisitTypeValue, number>;
}
