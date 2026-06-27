import { MvpPage } from "../mvp-page";

export default function AppointmentsPage() {
  return (
    <MvpPage
      eyebrow="Scheduling"
      title="Appointments"
      items={[
        "Appointment booking foundation",
        "Status changes use server-side permissions",
        "Calendar route supports date and doctor filters"
      ]}
    />
  );
}
