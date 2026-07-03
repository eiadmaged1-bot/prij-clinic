import type { ReactNode } from "react";

export function ResponsiveRecordList({ children }: { children: ReactNode }) {
  return <div className="data-list responsive-record-list">{children}</div>;
}
