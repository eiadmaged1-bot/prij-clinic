"use client";

import Link from "next/link";
import { useSession } from "@/app/session";

export function ReceptionMobileHomeLink() {
  const { user } = useSession();
  const roles = user?.roles ?? [];
  const isReceptionistOnly = roles.some((role) => ["Reception", "Receptionist"].includes(role)) && !roles.some((role) => ["Owner", "Admin", "Doctor"].includes(role));
  if (!isReceptionistOnly) return null;

  return (
    <Link className="reception-mobile-home-link" href="/reception" aria-label="Reception Home" title="Reception Home">
      <span aria-hidden="true">MA</span>
    </Link>
  );
}
