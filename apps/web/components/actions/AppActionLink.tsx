import Link from "next/link";
import { AnchorHTMLAttributes, ReactNode } from "react";
import { requireAppAction } from "@/lib/action-registry";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  actionId: string;
  locale?: "ar" | "en";
  href?: string;
  userPermissions?: string[];
  userRoles?: string[];
  children?: ReactNode;
};

export function AppActionLink({ actionId, locale = "en", href, userPermissions, userRoles, children, ...props }: Props) {
  const action = requireAppAction(actionId);
  const hasPermission = !action.permission || (userPermissions && userPermissions.includes(action.permission));
  const label = locale === "ar" ? action.labelAr : action.labelEn;

  if (!hasPermission) {
    return (
      <span className={`app-action-link disabled ${props.className || ""}`} aria-disabled="true" title={action.disabledReason}>
        {children || label}
      </span>
    );
  }

  return (
    <Link {...props} href={href || action.route || "#"} aria-label={props["aria-label"] || action.accessibleName} title={props.title || label}>
      {children || label}
    </Link>
  );
}

