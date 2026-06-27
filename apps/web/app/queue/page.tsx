import { MvpPage } from "../mvp-page";

export default function QueuePage() {
  return (
    <MvpPage
      eyebrow="Front desk"
      title="Queue"
      items={[
        "Today queue foundation",
        "Priority is operational only",
        "Call, complete, and cancel actions are audited"
      ]}
    />
  );
}
