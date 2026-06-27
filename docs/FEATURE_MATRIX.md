# Feature Matrix

Status values:
- Now: MVP requirement.
- Later: planned after MVP.
- No: intentionally out of scope for now.

| Area | Feature | Status | Notes |
| --- | --- | --- | --- |
| Patients | Create patient profile | Now | Fake/demo data only in development. |
| Patients | View patient profile | Now | Permission controlled and audit-aware. |
| Patients | Update demographics/contact info | Now | Track changes in audit log. |
| Patients | Consent records | Now | Basic consent status and notes. |
| Appointments | Book appointment | Now | Link patient, doctor, date, time, status. |
| Appointments | Doctor calendar | Now | Daily/weekly view target. |
| Queue | Daily queue | Now | Waiting, with doctor, completed, cancelled, no-show. |
| Encounters | Create encounter | Now | Doctor-authored clinical note. |
| Encounters | Edit encounter | Now | Permission controlled, audit logged. |
| Encounters | Delete encounter | Later | Prefer correction/void workflow over hard delete. |
| Prescriptions | Create prescription record | Now | Doctor-owned, audit logged. |
| Prescriptions | Print/export prescription | Later | Requires formatting and access controls. |
| Investigations | Request investigation | Now | Track request and status. |
| Investigations | Store result metadata | Now | File storage design must be secured. |
| Reports | Upload/reference report | Now | Access controlled, no files in repo. |
| Billing | Create invoice | Now | Consultation/services line items. |
| Billing | Record payment | Now | Paid/partial/refunded/voided states. |
| Billing | Reports | Later | Operational reports after core data is stable. |
| Users | Login/session | Now | Secure authentication required. |
| Users | Roles and permissions | Now | Server-side enforcement. |
| Audit | Audit clinical changes | Now | Required for clinical records. |
| Audit | Audit admin/security actions | Now | Include users, roles, permissions, exports. |
| Backups | Backup process | Now | Document and implement before production use. |
| Backups | Restore test process | Now | Required operational checklist. |
| Security | Secret-free config | Now | `.env.example` placeholders only. |
| Security | MFA | Later | Prioritize for admins/doctors. |
| AI | AI encounter draft | Later | Doctor review required. |
| AI | AI patient summary draft | Later | Doctor review required. |
| AI | Autonomous diagnosis | No | Prohibited. |
| AI | Autonomous prescribing | No | Prohibited. |
| Integrations | Lab integration | Later | After core MVP. |
| Integrations | Pharmacy integration | Later | After core MVP. |
| Integrations | Insurance claims | Later | Requires separate compliance review. |
| Portal | Patient portal | Later | Not MVP. |
| Telemedicine | Video visits | Later | Not MVP. |
