import { MvpPage } from "../mvp-page";

export default function CalendarPage() {
  return (
    <MvpPage
      eyebrow="Calendar"
      title="Doctor Calendar"
      items={[
        "Today schedule for doctors and reception.",
        "Open appointments can be handed to the waiting queue.",
        "Calendar visibility stays operational; no clinical decisions are automated."
      ]}
      endpoint={`/appointments/calendar?date=${new Date().toISOString().slice(0, 10)}`}
      collectionKey="appointments"
    />
  );
}
