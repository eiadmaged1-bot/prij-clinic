# Audit Governance

v0.16.0 strengthens audit readiness for real patient data preparation. This document does not claim full production, legal, or compliance readiness.

Audit expectations:

- Clinical record changes must be auditable.
- Administrative overrides must include a reason where supported.
- Audit metadata must redact credential-like values and bound large strings.
- Audit logs must not be deletable through normal app routes.
- Billing, payments, appointment status changes, queue status changes, medication safety review, and investigation cancel/void actions must keep audit records.
- AI clinical output remains draft-only until doctor review and approval.

Current limitations:

- v0.16.0 is a readiness gate, not a certified audit-retention policy.
- Deployment-specific log retention, export controls, backup retention, and compliance review remain required before real patient data.
