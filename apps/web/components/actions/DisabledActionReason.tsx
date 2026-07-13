export function DisabledActionReason({ reason }: { reason: string }) {
  if (!reason) return null;
  return <span className="action-disabled-reason">{reason}</span>;
}
