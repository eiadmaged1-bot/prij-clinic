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
    />
  );
}
