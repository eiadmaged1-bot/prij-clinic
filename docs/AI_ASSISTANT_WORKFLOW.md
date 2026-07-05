# AI Assistant Workflow

The AI assistant is a local, deterministic draft helper. It is available at `/ai-assistant` and inside the patient file AI tab for roles with `ai_draft.request` and `ai_draft.read`.

Workflow:
- Select or open a patient file.
- Review safety status: external AI disabled, draft-only mode, doctor review required.
- Generate a patient history summary draft, visit note summary draft, or follow-up reminder draft.
- Review the missing-field checklist.
- Use patient-file search for patient-scoped lookup only.
- Doctor approves or rejects AI draft artifacts.

The assistant does not diagnose, prescribe, dose, rank treatment options, send messages, sign records, or write into final clinical records.
