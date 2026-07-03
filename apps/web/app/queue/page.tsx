import { MvpPage } from "../mvp-page";

export default function QueuePage() {
  return (
    <MvpPage
      eyebrow="Reception"
      title="Queue Board"
      items={[
        "Checked-in patients appear for reception and doctor handoff.",
        "Statuses include waiting, with doctor, completed, and cancelled.",
        "Priority is operational only and is not emergency triage."
      ]}
      endpoint="/queue/today"
      collectionKey="queueTickets"
      createEndpoint="/queue/check-in"
      createNote="Use a local training patient file and optional appointment. Priority is operational only, not triage."
      createFields={[
        { name: "patientId", label: "Patient file", required: true },
        { name: "appointmentId", label: "Appointment reference" },
        { name: "priority", label: "Priority", defaultValue: "routine" }
      ]}
    />
  );
}
