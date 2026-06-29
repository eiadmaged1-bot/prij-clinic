import { MvpPage } from "../mvp-page";

export default function CalendarPage() {
  return (
    <MvpPage
      eyebrow="Scheduling"
      title="Doctor Calendar"
      items={[
        "Daily calendar foundation",
        "Doctor filtering is available for the calendar view",
        "No clinical decisions are automated"
      ]}
      endpoint={`/appointments/calendar?date=${new Date().toISOString().slice(0, 10)}`}
      collectionKey="appointments"
    />
  );
}
