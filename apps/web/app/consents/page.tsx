import { MvpPage } from "../mvp-page";

export default function ConsentsPage() {
  return (
    <MvpPage
      eyebrow="Consent and legal documents"
      title="Consent Workspace"
      items={[
        "Template list and patient consent records are visible for workflow review.",
        "Statuses are draft, signed, and voided; void actions require a reason where supported.",
        "Signature and print-friendly legal templates are placeholders until approved by the clinic."
      ]}
      collectionKey="consentRecords"
      createEndpoint="/consents"
      createNote="Use a fake demo patient file only. Do not enter real legal text, signatures, or patient notes."
      createFields={[
        { name: "patientId", label: "Patient file", required: true },
        { name: "consentType", label: "Consent type", required: true, defaultValue: "treatment" },
        { name: "status", label: "Status", required: true, defaultValue: "draft" },
        { name: "notes", label: "Notes", defaultValue: "Local demo consent placeholder. Legal review required before real use." }
      ]}
    />
  );
}
