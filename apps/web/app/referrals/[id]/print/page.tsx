"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getApiBaseUrl } from "@/lib/api-base-url";

export default function ReferralPrintPage() {
  const params = useParams<{ id: string }>();
  const [referral, setReferral] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    void fetch(`${getApiBaseUrl()}/referrals/${params.id}`, {
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    }).then((response) => response.ok ? response.json() : null).then(setReferral);
  }, [params.id]);

  return (
    <main className="print-page">
      <button className="button no-print" type="button" onClick={() => window.print()}>Print referral</button>
      <h1>Referral Letter</h1>
      <p>Print-friendly local demo letter. No external sending integration.</p>
      {referral ? (
        <section>
          <h2>{String(referral.referralType ?? "Referral")}</h2>
          <p><strong>Reason:</strong> {String(referral.reason ?? "")}</p>
          <p><strong>Clinical summary:</strong> {String(referral.clinicalSummary ?? "Doctor-authored summary not recorded.")}</p>
          <p><strong>Status:</strong> {String(referral.status ?? "")}</p>
        </section>
      ) : <p>Loading referral.</p>}
    </main>
  );
}
