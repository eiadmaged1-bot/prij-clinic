import { MvpPage } from "../mvp-page";

export default function PatientsPage() {
  return (
    <MvpPage
      eyebrow="Registration"
      title="Patients"
      items={[
        "Demo-safe patient registry foundation",
        "Server-side RBAC required for API access",
        "No real patient data in development"
      ]}
      endpoint="/patients"
      collectionKey="patients"
    />
  );
}
