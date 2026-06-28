import { MvpPage } from "../mvp-page";

export default function ConsentsPage() {
  return (
    <MvpPage
      eyebrow="Consent and privacy"
      title="Consents"
      items={[
        "Consent records require staff sign-in, patient access checks, and audit logging",
        "V0.1 consent is a controlled foundation, not production legal consent enforcement",
        "Real clinic consent text, signatures, retention, and privacy review are future requirements"
      ]}
      collectionKey="consentRecords"
      createEndpoint="/consents"
      createNote="Use a fake demo patient ID only. Do not enter legal signature text or real patient notes."
      createFields={[
        { name: "patientId", label: "Patient ID", required: true },
        { name: "consentType", label: "Consent type", required: true, defaultValue: "treatment" },
        { name: "status", label: "Status", required: true, defaultValue: "granted" },
        { name: "notes", label: "Notes", defaultValue: "Local demo consent record only. Legal review required before real use." }
      ]}
    />
  );
}
