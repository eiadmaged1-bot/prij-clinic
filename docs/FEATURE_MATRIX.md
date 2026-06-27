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
| Patients | Consent withdrawal/override tracking | Now | Requires reason and audit log. |
| Patients | Patient timeline | Now | Show permitted appointments, encounters, prescriptions, investigations, reports, invoices, and follow-up items. |
| Appointments | Book appointment | Now | Link patient, doctor, date, time, status. |
| Appointments | Reschedule/cancel/no-show | Now | Status transitions audit logged where sensitive. |
| Appointments | Doctor calendar | Now | Daily/weekly view target. |
| Queue | Daily queue | Now | Checked in, waiting, with assistant, ready for doctor, with doctor, completed, cancelled, no-show. |
| Queue | Walk-in handling | Now | Link to patient and optional doctor. |
| Assistant/Nurse | Vitals and prep notes | Now | Role-limited and separate from doctor-authored encounter notes. |
| Encounters | Create encounter | Now | Doctor-authored clinical note. |
| Encounters | Edit encounter | Now | Permission controlled, audit logged. |
| Encounters | Sign/finalize encounter | Now | Later corrections should be append/version based. |
| Encounters | Delete encounter | Later | Prefer correction/void workflow over hard delete. |
| Prescriptions | Create prescription record | Now | Doctor-owned, audit logged. |
| Prescriptions | Doctor approve/finalize prescription | Now | No autonomous prescribing. |
| Prescriptions | Cancel/replace prescription | Now | Requires reason and audit trail. |
| Prescriptions | Print/export prescription | Later | Requires formatting and access controls. |
| Investigations | Request investigation | Now | Track request and status. |
| Investigations | Track lifecycle status | Now | Requested, scheduled, sample collected, sent out, pending, received, reviewed, cancelled, voided. |
| Investigations | Store result metadata | Now | File storage design must be secured; no report files in repo. |
| Investigations | Lab integration | Later | Manual metadata/upload first; direct integration later. |
| Investigations | Imaging/PACS/RIS integration | Later | Manual metadata/upload first; direct integration later. |
| Investigations | Device integration | Later | Includes ultrasound machines and other diagnostic devices. |
| Reports | Upload/reference report | Now | Access controlled, no files in repo. |
| Reports | Ultrasound reports | Now | Manual upload/reference and doctor review status. |
| Reports | Radiology/imaging reports | Now | Manual upload/reference and doctor review status. |
| Reports | Laboratory reports | Now | Manual upload/reference and doctor review status. |
| Reports | Pathology/cytology reports | Now | Manual upload/reference and doctor review status. |
| Reports | Procedure reports | Now | Manual upload/reference and doctor review status. |
| Reports | External consultant reports | Now | Manual upload/reference and doctor review status. |
| Reports | Patient-provided prior reports | Now | Clearly mark source and receipt date. |
| Reports | Report review workflow | Now | Doctor marks reviewed and records follow-up where needed. |
| Reports | Automated report ingestion | Later | Requires separate integration, validation, and audit design. |
| Billing | Create invoice | Now | Consultation/services line items. |
| Billing | Record payment | Now | Paid/partial/refunded/voided states. |
| Billing | Discounts/refunds/voids | Now | Permission controlled with required audit reason. |
| Billing | Reports | Later | Operational reports after core data is stable. |
| Users | Login/session | Now | Secure authentication required. |
| Users | Roles and permissions | Now | Server-side enforcement. |
| Users | Branch/clinic scoping | Now | Required if multiple branches or clinic locations are configured. |
| Audit | Audit clinical changes | Now | Required for clinical records. |
| Audit | Audit sensitive reads/exports | Now | Include patient profile, reports, prescriptions, and billing exports. |
| Audit | Audit admin/security actions | Now | Include users, roles, permissions, exports. |
| Backups | Backup process | Now | Document and implement before production use. |
| Backups | Restore test process | Now | Required operational checklist. |
| Backups | Backup audit metadata | Now | Track backup runs and restore tests without storing backup files in repo. |
| Security | Secret-free config | Now | `.env.example` placeholders only. |
| Security | Server-side authorization | Now | UI hiding is not sufficient. |
| Security | Privacy-safe logs | Now | No clinical note bodies, report contents, passwords, tokens, or payment secrets. |
| Security | MFA | Later | Prioritize for admins/doctors. |
| AI | AI encounter draft | Later | Doctor review required. |
| AI | AI patient summary draft | Later | Doctor review required. |
| AI | AI draft approval workflow | Later | Must remain draft-only until explicit doctor approval. |
| AI | Autonomous diagnosis | No | Prohibited. |
| AI | Autonomous prescribing | No | Prohibited. |
| Integrations | Lab integration | Later | After core MVP and integration safety review. |
| Integrations | Radiology/imaging integration | Later | After core MVP and integration safety review. |
| Integrations | Pathology/cytology integration | Later | After core MVP and integration safety review. |
| Integrations | Pharmacy integration | Later | After core MVP. |
| Integrations | Insurance claims | Later | Requires separate compliance review. |
| Integrations | Payment gateway | Later | Do not store card/payment secrets in MVP. |
| Portal | Patient portal | Later | Not MVP. |
| Telemedicine | Video visits | Later | Not MVP. |
