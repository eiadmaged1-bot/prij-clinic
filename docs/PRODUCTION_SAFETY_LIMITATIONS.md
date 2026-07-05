# Production Safety Limitations

v0.16.1 is not a production release. It is a security stabilization and deployment-prep lock.

Current limitations:
- Real patient data entry remains blocked until deployment, backup, legal/privacy, and role-by-role QA are complete.
- Local backup readiness is not a monitored production backup program.
- Restore is documented as manual/admin-controlled and is not run automatically.
- Consent/legal text still requires clinic and jurisdiction review.
- Role-by-role browser QA remains required.
- Production secrets, TLS, CORS, monitoring, audit retention, and incident response require deployment review.

Clinical and integration limits:
- AI is doctor-assist and draft-only.
- External AI remains disabled by default.
- No autonomous diagnosis, prescribing, dosing, or treatment ranking is present.
- No WhatsApp, DICOM/PACS, insurance/TPA, full accounting ledger, real payment gateway, or mobile app is included.
