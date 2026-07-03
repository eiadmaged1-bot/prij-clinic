import type { ReactNode } from "react";

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const className = tone === "success" ? "badge accent" : tone === "warning" ? "badge warning" : tone === "danger" ? "badge danger" : "badge";
  return <span className={className}>{children}</span>;
}
