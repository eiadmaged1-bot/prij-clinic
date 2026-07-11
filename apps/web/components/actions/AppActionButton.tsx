"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { requireAppAction } from "@/lib/action-registry";
import { DisabledActionReason } from "./DisabledActionReason";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  actionId: string;
  locale?: "ar" | "en";
  isLoading?: boolean;
  disabledReason?: string;
  children?: ReactNode;
};

export function AppActionButton({ actionId, locale = "en", isLoading = false, disabledReason, children, disabled, ...props }: Props) {
  const action = requireAppAction(actionId);
  const reason = disabledReason || (disabled ? action.disabledReason : "");
  const label = locale === "ar" ? action.labelAr : action.labelEn;

  return (
    <span className="app-action-control">
      <button
        {...props}
        type={props.type || "button"}
        aria-label={props["aria-label"] || action.accessibleName}
        aria-busy={isLoading || undefined}
        disabled={disabled || isLoading}
        title={props.title || label}
      >
        {children || label}
      </button>
      {disabled || isLoading ? <DisabledActionReason reason={isLoading ? action.loadingState : reason} /> : null}
    </span>
  );
}

