import { ClinicOperationsPage } from "../clinic-operations-page";

export default function QueuePage() {
  return (
    <ClinicOperationsPage
      mode="queue"
      eyebrow="Reception"
      title="Queue Board"
      description="Checked-in patients move through waiting, doctor handoff, completed, or cancelled with operational status badges."
    />
  );
}
