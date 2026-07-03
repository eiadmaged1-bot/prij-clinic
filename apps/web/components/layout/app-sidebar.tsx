import type { ReactNode } from "react";

export function AppSidebar({ children }: { children: ReactNode }) {
  return <aside className="sidebar">{children}</aside>;
}
