# AI Safety Readiness

v0.16.0 keeps AI as doctor-assist and draft-only. It does not add external AI runtime calls, automatic diagnosis, automatic prescribing, dosing, or treatment ranking.

Readiness rules:

- AI output is advisory draft text until reviewed and approved by a doctor.
- AI must not write directly into clinical records.
- External AI providers remain disabled by default for this release.
- Medication safety population and review remain governed separately through Owner/Admin review.
- Prompt-injection and untrusted document content must not override clinical, security, consent, RBAC, or privacy rules.
- AI admin surfaces must not display secrets, provider keys, raw prompts containing PHI, or stack traces.

Known limitations:

- Future AI runtime work requires a separate safety review, audit plan, provider configuration review, and clinical validation workflow.
- v0.16.0 readiness does not authorize autonomous clinical decision-making.
