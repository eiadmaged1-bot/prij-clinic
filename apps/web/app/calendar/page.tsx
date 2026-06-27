import { MvpPage } from "../mvp-page";

export default function CalendarPage() {
  return (
    <MvpPage
      eyebrow="Scheduling"
      title="Doctor Calendar"
      items={[
        "Daily calendar foundation",
        "Doctor filtering is available through the API",
        "No clinical decisions are automated"
      ]}
    />
  );
}
