import { ClinicOperationsPage } from "../../clinic-operations-page";

export default function DoctorWaitingPage() {
  return (
    <ClinicOperationsPage
      mode="doctor"
      eyebrow="Doctor"
      title="Doctor Waiting List"
      description="Patients checked in for the doctor are shown with queue status, visit reason, pending investigation notes, and operational invoice notes."
    />
  );
}
