"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { requireAppAction } from "@/lib/action-registry";
import { DisabledActionReason } from "./DisabledActionReason";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  actionId: string;
  locale?: "ar" | "en";
  isLoading?: boolean;
  disabledReason?: string;
  userPermissions?: string[];
  userRoles?: string[];
  children?: ReactNode;
};

export function AppActionButton({ actionId, locale = "en", isLoading = false, disabledReason, userPermissions, userRoles, children, disabled, ...props }: Props) {
  const action = requireAppAction(actionId);
  const requiredPermissions = action.requiredPermissions ?? (action.permission ? [action.permission] : []);
  const hasPermission = requiredPermissions.length === 0 || requiredPermissions.every((permission) => userPermissions?.includes(permission));
  const isEffectivelyDisabled = disabled || isLoading || !hasPermission;
  const reason = disabledReason || (!hasPermission ? action.disabledReason : (disabled ? action.disabledReason : ""));
  const label = locale === "ar" ? action.labelAr : action.labelEn;

  return (
    <span className="app-action-control">
      <button
        {...props}
        type={props.type || "button"}
        aria-label={props["aria-label"] || action.accessibleName}
        aria-busy={isLoading || undefined}
        disabled={isEffectivelyDisabled}
        title={props.title || label}
      >
        {children || label}
      </button>
      {isEffectivelyDisabled ? <DisabledActionReason reason={isLoading ? action.loadingState : reason} /> : null}
    </span>
  );
}
