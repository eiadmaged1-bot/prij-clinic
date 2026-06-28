import { MvpPage } from "../mvp-page";

export default function InvestigationsPage() {
  return (
    <MvpPage
      eyebrow="Orders"
      title="Investigations"
      items={[
        "Investigation order and item foundation",
        "Lifecycle status tracking with audit events",
        "Priority is operational only, not emergency triage"
      ]}
    />
  );
}
