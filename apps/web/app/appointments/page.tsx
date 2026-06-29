import { MvpPage } from "../mvp-page";

export default function AppointmentsPage() {
  return (
    <MvpPage
      eyebrow="Scheduling"
      title="Appointments"
      items={[
        "Appointment booking foundation",
        "Status changes use server-side permissions",
        "Calendar view supports date and doctor filters"
      ]}
      endpoint="/appointments"
      collectionKey="appointments"
      createEndpoint="/appointments"
      createNote="Use a demo patient file from the Patients page. Scheduling text must stay demo-only."
      createFields={[
        { name: "patientId", label: "Patient file reference", required: true },
        { name: "startAt", label: "Start", type: "datetime-local", required: true },
        { name: "endAt", label: "End", type: "datetime-local", required: true },
        { name: "appointmentType", label: "Type", defaultValue: "Demo visit" },
        { name: "notes", label: "Notes", defaultValue: "Local demo appointment only." }
      ]}
    />
  );
}
