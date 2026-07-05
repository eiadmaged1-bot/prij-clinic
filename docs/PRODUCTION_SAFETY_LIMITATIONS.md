# Production Safety Limitations

v0.18.0 is not a production release. It is a staging deployment package and local production simulation sprint.

Current limitations:
- Real patient data entry remains blocked until deployment, backup, legal/privacy, and role-by-role QA are complete.
- Local backup readiness is not a monitored production backup program.
- Restore is documented as manual/admin-controlled and is not run automatically.
- Consent/legal text still requires clinic and jurisdiction review.
- Role-by-role browser QA remains required.
- Production secrets, TLS, CORS, monitoring, audit retention, and incident response require deployment review.
- Production requires legal/privacy review, real backup/restore drill, HTTPS, monitoring, secrets management, role-by-role browser QA, and deployment hardening.

Clinical and integration limits:
- AI is doctor-assist and draft-only.
- External AI remains disabled by default.
- No autonomous diagnosis, prescribing, dosing, or treatment ranking is present.
- No WhatsApp, DICOM/PACS, insurance/TPA, full accounting ledger, real payment gateway, or mobile app is included.
