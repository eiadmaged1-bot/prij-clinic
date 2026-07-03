import type { ReactNode } from "react";

export function MobileDrawer({ children, open }: { children: ReactNode; open: boolean }) {
  return <aside className={`sidebar ${open ? "open" : ""}`}>{children}</aside>;
}
