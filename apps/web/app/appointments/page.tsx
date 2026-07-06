import { MvpPage } from "../mvp-page";

export default function AppointmentsPage() {
  return (
    <MvpPage
      eyebrow="Reception"
      title="Appointment Desk"
      items={[
        "Book visits from a patient file or with a selected patient reference.",
        "Appointment status moves from scheduled to checked in, waiting, with doctor, completed, or cancelled.",
        "Cancelled visits should keep a reason when that backend action is used."
      ]}
      endpoint="/appointments"
      collectionKey="appointments"
      createEndpoint="/appointments"
      createNote="Use a patient file from Patients. The calendar and queue show the handoff after check-in."
      createFields={[
        { name: "patientId", label: "Patient file", required: true },
        { name: "startAt", label: "Start", type: "datetime-local", required: true },
        { name: "endAt", label: "End", type: "datetime-local", required: true },
        { name: "appointmentType", label: "Visit type", defaultValue: "Clinic visit" },
        { name: "notes", label: "Reception note", defaultValue: "Appointment note." }
      ]}
    />
  );
}
