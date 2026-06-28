import { MvpPage } from "../../mvp-page";

export default function NewPatientPage() {
  return (
    <MvpPage
      eyebrow="Registration"
      title="New Patient"
      items={[
        "Minimum demographic fields only",
        "Medical record number remains unique",
        "Create and update actions are audit logged"
      ]}
      endpoint="/patients"
      collectionKey="patients"
      createEndpoint="/patients"
      createNote="Use a demo MRN such as DEMO-PILOT-001. Do not enter real names, phone numbers, addresses, or clinical histories."
      createFields={[
        { name: "medicalRecordNumber", label: "Demo MRN", required: true, placeholder: "DEMO-PILOT-001" },
        { name: "firstName", label: "First name", required: true, defaultValue: "Demo" },
        { name: "lastName", label: "Last name", required: true, defaultValue: "Pilot" },
        { name: "notes", label: "Notes", defaultValue: "Local V0.1 demo record only." }
      ]}
    />
  );
}
