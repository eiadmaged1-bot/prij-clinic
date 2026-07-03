import type { ReactNode } from "react";

export function PageFrame({ children }: { children: ReactNode }) {
  return <div className="page-frame">{children}</div>;
}
