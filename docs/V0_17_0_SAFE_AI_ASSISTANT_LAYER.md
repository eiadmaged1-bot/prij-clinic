# v0.17.0 Safe AI Assistant Layer

v0.17.0 adds the first safe AI assistant layer for Prij Clinic. It is not a production AI release.

Implemented scope:
- `/ai-assistant` shell for Owner/Admin/Doctor users.
- Patient-file AI assistant panel in the patient workspace.
- Deterministic local patient history summary draft.
- Deterministic local visit note summary draft.
- Deterministic missing-field checklist.
- Follow-up reminder draft that is not sent automatically.
- Patient-scoped file search helper.
- Doctor approval/rejection workflow on AI draft artifacts.
- AI generation, review, search, and prompt-injection warning audit events.
- v0.17 source-level safety regression checks.

Safety boundaries:
- AI is assistive only.
- AI drafts require doctor review and approval.
- No autonomous diagnosis, prescribing, dosing, treatment ranking, or final clinical decision is generated.
- External AI calls are disabled by default.
- PHI/PII must not be sent externally unless a future governance sprint explicitly adds consent, contracts, privacy review, and provider controls.
- External content, document text, OCR text, and patient-entered text are treated as untrusted content, not instructions.
- Draft approval does not automatically copy text into final clinical records.

Regression commands:

```powershell
npm run test:v170:ai-safety-layer
npm run test:v170:prompt-injection-guard
npm run test:v170:safe-ai-assistant
```
