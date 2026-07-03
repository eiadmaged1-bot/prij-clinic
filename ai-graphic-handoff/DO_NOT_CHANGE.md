# Do Not Change

This handoff must not weaken or remove:

- LAN CORS hardening.
- Image metadata stripping and sanitizer behavior.
- `metadata_only` and `local_demo_file` storage policy.
- Schema integrity hardening.
- `queueDate` migration behavior.
- Encounter voiding behavior.
- Queue duplicate remediation protections.
- RBAC, consent, audit log, backup, and privacy requirements.

This sprint must not add:

- Backend clinical logic changes.
- Database schema changes.
- Real patient data.
- Fake medical claims.
- AI diagnosis.
- AI prescribing.
- Medication dosing automation.
- Secrets or environment values.
- Release tags.
