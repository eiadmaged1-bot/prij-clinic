import { MvpPage } from "../mvp-page";

export default function ConsentsPage() {
  return (
    <MvpPage
      eyebrow="Consent and privacy"
      title="Consents"
      items={[
        "Consent records are a V0.1 foundation only",
        "Consent routes require authentication, RBAC, branch scope, and audit metadata",
        "Production legal text, signatures, overrides, and full workflow blocking remain future work"
      ]}
      endpoint="/consents"
      collectionKey="consents"
      createEndpoint="/consents"
      createNote="Use a demo patient ID only. Do not enter real legal consent text or real patient identifiers."
      createFields={[
        { name: "patientId", label: "Patient ID", required: true },
        { name: "consentType", label: "Consent type", required: true, defaultValue: "treatment" },
        { name: "status", label: "Status", required: true, defaultValue: "granted" },
        { name: "notes", label: "Notes", defaultValue: "Local V0.1 demo consent record only." }
      ]}
    />
  );
}
