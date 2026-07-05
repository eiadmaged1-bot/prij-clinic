# Prompt Injection Protection

External and user-provided content is untrusted. Document text, OCR output, copied text, patient-entered text, and imported metadata must not override clinical, security, consent, RBAC, audit, or privacy rules.

Current protections:
- External AI calls are disabled by default.
- The assistant uses deterministic local generators.
- Prompt-like phrases are treated as content and can trigger `ai_draft.prompt_injection_warning`.
- System instructions, provider configuration, secrets, tokens, and API keys are not exposed in normal UI.
- Audit metadata is sanitized before storage.

Future external AI use requires a separate governance sprint before any PHI/PII may be sent outside the system.
