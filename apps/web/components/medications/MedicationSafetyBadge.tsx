"use client";

export function MedicationSafetyBadge({ label, value }: { label: string; value?: string | null }) {
  const normalized = String(value ?? "REVIEW_REQUIRED").toUpperCase();
  const className = normalized === "D" || normalized === "X" || normalized === "AVOID" || normalized === "REVIEW_REQUIRED" ? "badge danger" : normalized === "UNKNOWN" || normalized === "INSUFFICIENT_DATA" ? "badge warning" : "badge";
  return <span className={className}>{label}: {friendlyValue(normalized)}</span>;
}

function friendlyValue(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
