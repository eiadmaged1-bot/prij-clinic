import Link from "next/link";
import { AnchorHTMLAttributes, ReactNode } from "react";
import { requireAppAction } from "@/lib/action-registry";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  actionId: string;
  locale?: "ar" | "en";
  href?: string;
  children?: ReactNode;
};

export function AppActionLink({ actionId, locale = "en", href, children, ...props }: Props) {
  const action = requireAppAction(actionId);
  const label = locale === "ar" ? action.labelAr : action.labelEn;
  return (
    <Link {...props} href={href || action.route || "#"} aria-label={props["aria-label"] || action.accessibleName} title={props.title || label}>
      {children || label}
    </Link>
  );
}

