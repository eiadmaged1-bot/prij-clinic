export function FormulaStatusBadge({ status }: { status: string }) {
  const label = status === "verified" ? "Verified" : status === "draft" ? "Draft" : status === "retired" ? "Retired" : "Catalog only";
  const tone = status === "verified" ? "accent" : status === "retired" ? "danger" : "warning";
  return <span className={`badge ${tone}`}>{label}</span>;
}
