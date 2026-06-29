export function ProtocolStatusBadge({ status }: { status: string }) {
  const label = status === "verified" ? "Verified snapshot" : status === "draft" ? "Draft" : status === "retired" ? "Retired" : "Catalog only";
  return <span className={`badge protocol-status protocol-status-${status}`}>{label}</span>;
}
