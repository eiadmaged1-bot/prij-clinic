# Next Steps

Recommended next sprint:
- Run manual browser QA for `/clinic-day/walkthrough` through one full synthetic clinic day.
- Run full manual browser QA for v0.14.3.1 on laptop and mobile widths.
- Add browser-level E2E for the v0.14.4 walkthrough after manual QA confirms the route order.
- Expand dynamic E2E coverage for patient action drawers and searchable pickers.
- Replace remaining raw doctor ID / room placeholders with configured provider and room pickers.
- Continue account workflow hardening for staging/production password policies.
- Continue official medication clinical-safety review workflow without bulk clinical claims.
- Add browser-level assertions for the shared PatientPicker in appointment drawers when that workflow is expanded.
# Next Steps

Recommended next sprint: Security + Real Patient Data Readiness.

Focus areas:

- Re-review RBAC for real clinic roles and least privilege.
- Harden consent, audit, backup, and restore workflows before real patient use.
- Confirm PHI/PII handling, metadata stripping, and document storage retention.
- Add audited settings persistence for clinic profile, invoice defaults, and receipt notes.
- Add non-destructive invoice/payment correction flows with explicit reasons.
- Prepare production data migration and demo-data separation policy.

Do not add WhatsApp, insurance/TPA, payment gateways, DICOM/PACS, mobile app, or external AI runtime calls before the security readiness sprint is complete.
