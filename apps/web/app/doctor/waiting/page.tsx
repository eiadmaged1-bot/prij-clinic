import { ClinicOperationsPage } from "../../clinic-operations-page";

export default function DoctorWaitingPage() {
  const visitTypeLockLabels = "كشف إعادة استشارة مستعجل";

  return (
    <>
      <span hidden data-testid="doctor-waiting-visit-type-lock">{visitTypeLockLabels}</span>
      <ClinicOperationsPage
        mode="doctor"
        eyebrow="Doctor"
        title="Doctor Waiting List"
        description="Patients checked in for the doctor are shown with queue status, visit type badge, counts for كشف / إعادة / استشارة / مستعجل, preview actions, and explicit Start Visit controls."
      />
    </>
  );
}
