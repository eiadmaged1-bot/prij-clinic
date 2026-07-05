# v0.16.1 Security Deployment Prep Lock

v0.16.1 is a staging and deployment-prep stabilization sprint. It is not a production release and does not authorize real patient data entry.

Locked baseline:
- v0.14.4 clinic walkthrough remains discoverable through `/clinic-day/walkthrough`.
- v0.15.0 MVP business layer remains limited to clinic operations, manual billing, and manual payments.
- v0.16.0 security and real patient data readiness gates remain active.
- Local startup, deployment-prep, backup/restore documentation, production environment checks, and final regression coverage are part of this lock.

Safety boundaries:
- Real patient data entry is still blocked until deployment, backups, legal/privacy review, and role-by-role QA are complete.
- External AI remains disabled unless explicitly configured in a later reviewed sprint.
- AI remains doctor-assist and draft-only until a doctor reviews and approves it.
- No autonomous diagnosis, prescribing, dosing, treatment ranking, or fake clinical claims are included.
- No WhatsApp, DICOM/PACS, insurance/TPA, full accounting ledger, real payment gateway, or mobile app is included.

Verification:
- `npm run test:v161:startup-readiness`
- `npm run test:v161:deployment-prep`
- `npm run test:v161:backup-runbook`
- `npm run test:v161:role-by-role-readiness`
- `npm run test:v161:security-deployment-prep-lock`
