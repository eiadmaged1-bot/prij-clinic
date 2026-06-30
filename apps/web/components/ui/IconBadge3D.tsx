"use client";

import { clsx } from "clsx";
import type { AppIconDefinition, IconTone } from "../../lib/app-icons";

export function IconBadge3D({
  icon,
  size = "md",
  tone,
  label
}: {
  icon: AppIconDefinition;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: IconTone;
  label?: string;
}) {
  const LineIcon = icon.icon;
  const accessibleLabel = label ?? icon.label;

  return (
    <span className={clsx("icon-badge-3d", `icon-badge-${size}`, `icon-badge-${tone ?? icon.tone}`)} role="img" aria-label={accessibleLabel} data-app-icon={icon.name}>
      <span className="icon-badge-shine" aria-hidden="true" />
      <LineIcon aria-hidden="true" strokeWidth={1.9} />
    </span>
  );
}
