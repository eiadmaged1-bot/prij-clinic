import { MvpPage } from "../mvp-page";

export default function EncountersPage() {
  return (
    <MvpPage
      eyebrow="Clinical records"
      title="Encounters"
      items={[
        "Doctor-authored encounter draft foundation",
        "Signed encounters are blocked from silent edits",
        "Create, update, and sign actions are audit logged"
      ]}
      endpoint="/encounters"
      collectionKey="encounters"
      createEndpoint="/encounters"
      createNote="Demo text only. Do not enter real clinical histories, diagnoses, or treatment plans."
      createFields={[
        { name: "patientId", label: "Patient ID", required: true },
        { name: "appointmentId", label: "Appointment ID" },
        { name: "chiefComplaint", label: "Demo reason", defaultValue: "Demo visit reason only." },
        { name: "planText", label: "Demo plan", defaultValue: "Demo follow-up note only. Doctor review required." }
      ]}
    />
  );
}
