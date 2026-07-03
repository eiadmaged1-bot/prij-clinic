import { MvpPage } from "../mvp-page";

export default function PregnancyPage() {
  return (
    <MvpPage
      eyebrow="OB care"
      title="Pregnancy"
      items={[
        "Pregnancy overview records linked to patient profiles",
        "Gravida, para, dates, risk label, and notes are stored as structured draft data",
        "Pregnancy record changes require authorized staff access and audit logging"
      ]}
      endpoint="/pregnancies"
      collectionKey="pregnancies"
      createEndpoint="/pregnancies"
      createNote="Use local training patient IDs only. This foundation does not provide clinical risk scoring or diagnostic logic."
      createFields={[
        { name: "patientId", label: "Patient ID", required: true },
        { name: "status", label: "Status", defaultValue: "active" },
        { name: "gravida", label: "Gravida", type: "number" },
        { name: "para", label: "Para", type: "number" },
        { name: "riskLevel", label: "Risk label", defaultValue: "routine" },
        { name: "notes", label: "Notes", defaultValue: "Local demo pregnancy record only." }
      ]}
    />
  );
}
