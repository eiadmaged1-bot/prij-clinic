"use client";

import { appIcons, type AppIconName, type IconTone } from "../../lib/app-icons";
import { IconBadge3D } from "./IconBadge3D";

export function AppIcon({
  name,
  size = "md",
  tone,
  label
}: {
  name: AppIconName;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: IconTone;
  label?: string;
}) {
  return <IconBadge3D icon={appIcons[name] ?? appIcons.dashboard} label={label} size={size} tone={tone} />;
}
