const ranks: Record<string, number> = {
  info: 1,
  low: 2,
  moderate: 3,
  major: 4,
  critical: 5
};

export function severityRank(severity: string | null | undefined) {
  return ranks[String(severity ?? "info").toLowerCase()] ?? 1;
}
