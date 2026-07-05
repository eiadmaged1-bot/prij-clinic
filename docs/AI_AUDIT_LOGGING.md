# AI Audit Logging

v0.17.0 records AI assistant activity through the existing audit log.

Audited events include:
- `ai_assistant.patient_context_read`
- `ai_draft.safe_assistant_generated`
- `ai_draft.prompt_injection_warning`
- `ai_assistant.patient_file_search`
- `ai_draft.approved`
- `ai_draft.rejected`

AI audit metadata records that external AI access is false and clinical insertion is false. Audit entries must not include secrets, raw tokens, API keys, or unnecessary PHI.
