import { MvpPage } from "../mvp-page";
import Link from "next/link";

export default function PrescriptionsPage() {
  return (
    <>
      <MvpPage
        eyebrow="Doctor review"
        title="Prescriptions"
        items={[
          "Prescription records and items are doctor-authored",
          "Market variants can be used as reference details only",
          "Patient directions are manually written by the doctor",
          "No autonomous prescribing or AI prescribing",
          "Signing is explicit and audit logged"
        ]}
        endpoint="/prescriptions"
        collectionKey="prescriptions"
      />
      <div className="floating-action-note">
        <Link className="button secondary compact" href="/drug-market/search">Open market reference</Link>
        <Link className="button secondary compact" href="/medications/safety">Run safety review</Link>
      </div>
    </>
  );
}
