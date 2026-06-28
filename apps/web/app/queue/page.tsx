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
      endpoint="/queue/today"
      collectionKey="queueTickets"
      createEndpoint="/queue/check-in"
      createNote="Use a demo patient ID and optional appointment ID. Priority is operational only, not triage."
      createFields={[
        { name: "patientId", label: "Patient ID", required: true },
        { name: "appointmentId", label: "Appointment ID" },
        { name: "priority", label: "Priority", defaultValue: "routine" }
      ]}
    />
  );
}
