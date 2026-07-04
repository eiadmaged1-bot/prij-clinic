import { ClinicOperationsPage } from "../clinic-operations-page";

export default function CalendarPage() {
  return (
    <ClinicOperationsPage
      mode="calendar"
      eyebrow="Calendar"
      title="Doctor Calendar"
      description="Today schedule for doctors and reception, with check-in, cancellation, no-show, queue, and billing notes kept operational."
    />
  );
}
