import { MvpPage } from "../mvp-page";

export default function AiDraftsPage() {
  return (
    <MvpPage
      eyebrow="AI Drafts"
      title="AI Draft Review Placeholder"
      items={[
        "External AI access is disabled in the MVP and no provider keys are stored in code",
        "AI draft placeholders are labeled as draft-only and require doctor review",
        "AI draft review updates only the draft artifact and cannot sign records, prescribe, diagnose, or bypass RBAC"
      ]}
      endpoint="/ai-drafts"
      collectionKey="aiDrafts"
      createEndpoint="/ai-drafts"
      createNote="Creates a disabled/mock placeholder only. No external AI request is made."
      createFields={[
        { name: "draftType", label: "Draft type", required: true, defaultValue: "encounter_summary" },
        { name: "patientId", label: "Patient ID" },
        { name: "encounterId", label: "Encounter ID" },
        { name: "inputSourceSummary", label: "Input summary", defaultValue: "Local demo AI draft only. No external AI request." }
      ]}
    />
  );
}
