import type { ReactNode } from "react";
import { ThreeDMedicalIcon, type IconName } from "../ThreeDMedicalIcon";

export function EmptyState({ children, icon = "files" }: { children: ReactNode; icon?: IconName }) {
  return (
    <p className="empty-state">
      <ThreeDMedicalIcon name={icon} size="sm" tone="slate" />
      <span>{children}</span>
    </p>
  );
}
