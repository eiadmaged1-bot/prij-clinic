import { MvpPage } from "../mvp-page";

export default function PrescriptionsPage() {
  return (
    <MvpPage
      eyebrow="Doctor review"
      title="Prescriptions"
      items={[
        "Prescription records and items are doctor-authored",
        "No autonomous prescribing or AI prescribing",
        "Signing is explicit and audit logged"
      ]}
      endpoint="/prescriptions"
      collectionKey="prescriptions"
    />
  );
}
