# Next Steps

After v0.17.1, keep the Safe AI Assistant layer locked while preparing only governance-reviewed changes.

Required before any future copy-to-record or production AI workflow:
- Keep AI output draft-only until an authorized doctor explicitly reviews it.
- Design copy-to-record as a separate audited, doctor-confirmed workflow.
- Keep external AI disabled by default unless a future privacy, consent, vendor, and security review approves it.
- Keep PHI/PII inside the local system unless explicit future governance allows otherwise.
- Keep receptionist/accountant access blocked from clinical AI tools.

Do not add autonomous diagnosis, prescribing, dosing, treatment ranking, final clinical record writing, external AI calls, or fake production medical claims.

After v0.17.0, keep AI work in a safety-hardening track.

Required before production AI or external AI:
- Complete clinical governance review of every draft type.
- Add explicit consent, privacy review, vendor review, and data processing controls before any PHI/PII leaves the system.
- Add browser E2E coverage for doctor review and rejection paths.
- Add copy-to-record only as a future doctor-confirmed, audited action if governance approves it.
- Keep external AI disabled by default.

Do not add autonomous diagnosis, prescribing, dosing, treatment ranking, WhatsApp, SMS/email sending, DICOM/PACS, insurance/TPA, real payment gateway, or fake clinical claims.

After v0.16.1, continue staging deployment validation without adding new product features.

Required next steps before real patient data:
- Complete deployment, backup, legal/privacy, and role-by-role QA gates.
- Run a controlled restore drill in non-production before claiming backup/restore readiness.
- Verify production secrets, TLS, CORS, monitoring, log retention, audit retention, and incident response.
- Keep `DEMO_MODE=false` for production-shaped environments and keep demo credentials disabled.
- Keep external AI disabled by default; AI remains doctor-assist and draft-only.

Do not add WhatsApp, DICOM/PACS, insurance/TPA, full accounting ledger, real payment gateway, mobile app, external AI runtime calls, automatic diagnosis, automatic prescribing, automatic dosing, treatment ranking, or fake clinical claims in this stabilization path.

Recommended next sprint: security stabilization + deployment prep.

Focus areas:

- Run role-by-role browser QA against Owner, Admin, Doctor, Receptionist, Accountant, and Nurse boundaries.
- Prepare deployment secrets management, TLS, CORS, database access, log retention, and monitoring.
- Convert local backup readiness into monitored production backup scheduling, retention, and restore drills.
- Complete consent/legal/privacy review before real patient data.
- Review audit retention, export, and incident-response procedures.
- Keep AI disabled by default, doctor-assist, and draft-only unless a future sprint completes a separate reviewed AI safety plan.

Do not add WhatsApp, DICOM/PACS, insurance, a real payment gateway, full ledger, mobile app, external AI runtime calls, automatic diagnosis, automatic prescribing, automatic dosing, or fake clinical claims in the stabilization sprint.

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
