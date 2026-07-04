import { ClinicOperationsPage } from "../clinic-operations-page";

export default function InvestigationsPage() {
  return (
    <ClinicOperationsPage
      mode="investigations"
      eyebrow="Orders"
      title="Investigations"
      description="Doctor-requested lab, radiology, ultrasound, and pathology orders appear here for handoff and print-friendly request review."
    />
  );
}
