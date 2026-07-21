"use client";

import Link from "next/link";

export function ReceptionMobileHomeLink() {
  return (
    <Link className="reception-mobile-home-link" href="/reception" aria-label="Reception Home" title="Reception Home">
      <span aria-hidden="true">MA</span>
    </Link>
  );
}
