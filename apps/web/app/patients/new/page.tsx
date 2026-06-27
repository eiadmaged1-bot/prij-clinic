import { MvpPage } from "../../mvp-page";

export default function NewPatientPage() {
  return (
    <MvpPage
      eyebrow="Registration"
      title="New Patient"
      items={[
        "Minimum demographic fields only",
        "Medical record number remains unique",
        "Create and update actions are audit logged"
      ]}
    />
  );
}
