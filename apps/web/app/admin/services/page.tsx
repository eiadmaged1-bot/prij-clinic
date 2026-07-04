"use client";

import Link from "next/link";
import AdminPage from "../page";

export default function AdminServicesPage() {
  return (
    <>
      <AdminPage />
      <div className="sr-only">
        <Link href="/admin">Owner Control Center</Link>
      </div>
    </>
  );
}
