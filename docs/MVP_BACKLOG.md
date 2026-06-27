# MVP Backlog

## Scope Rules
Prij Clinic is a clinic management system for OB/GYN and women's health. The MVP must support safe daily clinic operations before AI-assisted clinical drafting is introduced.

Classification values:
- Phase: MVP, V1, V2, Future.
- Clinical risk: Low, Medium, High, Critical.
- Privacy risk: Low, Medium, High, Critical.
- Technical difficulty: Low, Medium, High.

Risk ratings describe implementation and workflow risk, not medical advice quality.

## Feature Backlog
| ID | Area | Feature | Phase | Clinical risk | Privacy risk | Technical difficulty | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PAT-001 | Patient registration | Search existing patient before create | MVP | Medium | High | Medium | Prevent duplicates before registration. |
| PAT-002 | Patient registration | Create patient profile with minimum demographics | MVP | Medium | High | Medium | Include contact and emergency contact fields only as needed. |
| PAT-003 | Patient registration | Update demographics and contact details | MVP | Medium | High | Medium | Changes require audit logs. |
| PAT-004 | Patient registration | Consent status records | MVP | High | High | Medium | Treatment, communication, report storage, and future sharing consent. |
| PAT-005 | Patient registration | Consent withdrawal and override workflow | MVP | High | High | High | Require reason and high-visibility audit event. |
| PAT-006 | Patient registration | Duplicate patient review and merge proposal | V1 | Medium | High | High | No automatic merges without authorized review. |
| PAT-007 | Patient registration | Patient labels, flags, and administrative notes | V1 | Medium | High | Medium | Must avoid unsafe clinical shortcuts. |
| APT-001 | Appointments | Book appointment | MVP | Medium | High | Medium | Link patient, doctor, scheduled time, reason summary, and status. |
| APT-002 | Appointments | Reschedule appointment | MVP | Medium | High | Medium | Preserve history and audit status changes. |
| APT-003 | Appointments | Cancel appointment | MVP | Low | Medium | Low | Cancellation reason should be optional or required by clinic policy. |
| APT-004 | Appointments | Mark no-show | MVP | Low | Medium | Low | Used for queue and reporting. |
| APT-005 | Appointments | Appointment conflict warning | MVP | Medium | Medium | Medium | Warn on doctor/time overlap. |
| APT-006 | Appointments | Appointment reminders | V1 | Medium | High | High | Requires communication consent and delivery channel decisions. |
| APT-007 | Appointments | Recurring appointments | V2 | Low | Medium | Medium | Useful for follow-up plans but not required for MVP. |
| QUE-001 | Queue | Today's queue | MVP | Medium | High | Medium | Include scheduled visits and walk-ins. |
| QUE-002 | Queue | Queue status transitions | MVP | Medium | High | Medium | Checked in, waiting, with assistant, ready for doctor, with doctor, completed, cancelled, no-show. |
| QUE-003 | Queue | Walk-in handling | MVP | Medium | High | Medium | Link to patient and optional doctor. |
| QUE-004 | Queue | Priority marker | MVP | Medium | High | Low | Administrative priority only; not emergency triage. |
| QUE-005 | Queue | Rooming and assistant handoff | MVP | Medium | High | Medium | Role-limited updates. |
| QUE-006 | Queue | Multi-room or multi-branch queue | V1 | Medium | High | High | Requires branch and assignment scoping. |
| CAL-001 | Doctor calendar | Daily doctor schedule | MVP | Medium | High | Medium | Filter by authorized doctor and clinic scope. |
| CAL-002 | Doctor calendar | Weekly calendar | MVP | Low | High | Medium | Read-only or action-enabled based on role. |
| CAL-003 | Doctor calendar | Calendar filters | MVP | Low | Medium | Low | Doctor, branch, status. |
| CAL-004 | Doctor calendar | Doctor availability templates | V1 | Low | Medium | Medium | Needed before advanced scheduling. |
| CAL-005 | Doctor calendar | Leave and blocked time | V1 | Low | Medium | Medium | Prevent booking conflicts. |
| PROF-001 | Patient profile | Patient summary header | MVP | Medium | High | Medium | Show minimum necessary identifiers. |
| PROF-002 | Patient profile | Timeline of permitted records | MVP | High | High | High | Appointments, encounters, prescriptions, investigations, reports, invoices, follow-ups. |
| PROF-003 | Patient profile | Consent visibility on profile | MVP | High | High | Medium | Missing or withdrawn consent must be visible. |
| PROF-004 | Patient profile | Sensitive read audit for profile access | MVP | Medium | High | Medium | At least for high-sensitivity views and exports. |
| PROF-005 | Patient profile | Attach administrative documents | V1 | Medium | High | High | Requires secure file storage and retention decisions. |
| ENC-001 | Encounters | Create encounter linked to appointment or walk-in | MVP | High | High | High | Doctor-owned clinical record. |
| ENC-002 | Encounters | Doctor-authored notes | MVP | High | High | High | Complaint, history, examination, assessment, plan, follow-up. |
| ENC-003 | Encounters | Assistant or nurse prep notes | MVP | Medium | High | Medium | Must remain distinct from doctor-authored notes. |
| ENC-004 | Encounters | Sign or finalize encounter | MVP | High | High | High | Finalization must be explicit. |
| ENC-005 | Encounters | Correct signed encounter | MVP | High | High | High | Version or append correction; do not silently overwrite. |
| ENC-006 | Encounters | Void encounter with reason | V1 | High | High | High | Prefer correction workflow unless void is necessary. |
| ENC-007 | Encounters | Structured OB/GYN templates | V1 | High | High | High | Must be reviewed by clinical owner before use. |
| RX-001 | Prescriptions | Create prescription record | MVP | High | High | High | Linked to encounter and doctor. |
| RX-002 | Prescriptions | Prescription items | MVP | High | High | Medium | Medication name, dose, frequency, duration, route, notes. |
| RX-003 | Prescriptions | Doctor approve or finalize prescription | MVP | Critical | High | High | Only authorized doctor can approve. |
| RX-004 | Prescriptions | Cancel, replace, or void prescription | MVP | High | High | High | Requires reason and audit log. |
| RX-005 | Prescriptions | Print or export prescription | V1 | High | High | High | Requires formatting, access control, and export audit. |
| RX-006 | Prescriptions | Medication favorites | V2 | High | Medium | Medium | Must avoid unsafe automatic prescribing. |
| INV-001 | Investigations | Request investigation from encounter | MVP | High | High | High | Include type, category, reason, priority, instructions. |
| INV-002 | Investigations | Investigation lifecycle tracking | MVP | High | High | High | Requested, scheduled, sample collected, sent out, result pending, result received, reviewed, cancelled, voided. |
| INV-003 | Investigations | Result metadata | MVP | High | High | Medium | Store metadata, not files in repository. |
| INV-004 | Investigations | Doctor review status | MVP | High | High | Medium | Reviewed by doctor with timestamp and note. |
| INV-005 | Investigations | Investigation cancellation or void | MVP | Medium | High | Medium | Requires reason for voids. |
| INV-006 | Investigations | Investigation catalog | V1 | Medium | Medium | Medium | Clinic-configured list of common tests and scans. |
| REP-001 | Reports | Manual report upload or secure reference | MVP | High | Critical | High | Files must be outside repository in controlled storage. |
| REP-002 | Reports | Laboratory reports | MVP | High | Critical | High | Manual upload/reference and doctor review. |
| REP-003 | Reports | Radiology and imaging reports | MVP | High | Critical | High | Manual upload/reference and doctor review. |
| REP-004 | Reports | Ultrasound reports | MVP | High | Critical | High | Manual upload/reference and doctor review. |
| REP-005 | Reports | Pathology reports | MVP | High | Critical | High | Manual upload/reference and doctor review. |
| REP-006 | Reports | Cytology reports | MVP | High | Critical | High | Manual upload/reference and doctor review. |
| REP-007 | Reports | External PDFs and images | MVP | High | Critical | High | Includes scanned documents and patient-provided prior reports. |
| REP-008 | Reports | External consultant reports | MVP | High | Critical | High | Clearly mark source and receipt date. |
| REP-009 | Reports | Report review workflow | MVP | High | Critical | High | Doctor review, follow-up note, status transition. |
| REP-010 | Reports | Report view, download, and export permissions | MVP | High | Critical | High | Export is separate from read permission. |
| REP-011 | Reports | Report correction, void, and deletion workflow | MVP | High | Critical | High | Use void/correction over hard delete when possible. |
| REP-012 | Report integrations | Direct lab integration | V2 | High | Critical | High | Requires integration safety design, consent, reconciliation, and audit. |
| REP-013 | Report integrations | Direct radiology, PACS, or RIS integration | V2 | High | Critical | High | Manual workflow first. |
| REP-014 | Report integrations | Direct ultrasound device import | V2 | High | Critical | High | Requires device mapping and validation. |
| REP-015 | Report integrations | Direct pathology or cytology integration | V2 | High | Critical | High | Requires external system contract and validation. |
| BILL-001 | Billing and payments | Create invoice | MVP | Low | High | Medium | Consultation, procedure, investigation, and service line items. |
| BILL-002 | Billing and payments | Invoice statuses | MVP | Low | High | Medium | Draft, issued, paid, partially paid, refunded, cancelled, voided. |
| BILL-003 | Billing and payments | Record payment | MVP | Low | High | Medium | Do not store card numbers or payment secrets. |
| BILL-004 | Billing and payments | Partial payment and balance tracking | MVP | Low | High | Medium | Required for daily operations. |
| BILL-005 | Billing and payments | Discounts, refunds, reversals, and voids | MVP | Low | High | High | Permission-controlled with required reason. |
| BILL-006 | Billing and payments | Payment gateway integration | V2 | Low | Critical | High | Requires payment security review. |
| DASH-001 | Reports/dashboard | Daily clinic dashboard | MVP | Low | Medium | Medium | Appointments, queue, completed visits, invoices, payments. |
| DASH-002 | Reports/dashboard | Doctor workload report | MVP | Low | Medium | Medium | Use aggregate data where possible. |
| DASH-003 | Reports/dashboard | Billing summary | MVP | Low | High | Medium | Revenue, balances, refunds, voids. |
| DASH-004 | Reports/dashboard | Investigation and report pending review list | MVP | High | High | Medium | Supports clinical follow-up. |
| DASH-005 | Reports/dashboard | Export operational reports | V1 | Low | High | High | Requires export permission and audit. |
| DASH-006 | Reports/dashboard | Advanced analytics | V2 | Medium | High | High | Must avoid unsupported clinical claims. |
| RBAC-001 | Roles and permissions | Staff login and sessions | MVP | Medium | High | High | Secure authentication required for all access. |
| RBAC-002 | Roles and permissions | Initial roles | MVP | Medium | High | Medium | Admin, doctor, receptionist, nurse/assistant, billing, read-only auditor. |
| RBAC-003 | Roles and permissions | Permission catalog | MVP | Medium | High | High | Explicit server-side permission checks. |
| RBAC-004 | Roles and permissions | Clinic or branch scoping | MVP | Medium | High | High | Required if more than one branch exists. |
| RBAC-005 | Roles and permissions | User and role management | MVP | Medium | High | High | Admin-only and audited. |
| RBAC-006 | Roles and permissions | MFA for admin and doctor accounts | V1 | Medium | High | Medium | Prioritize after basic auth is stable. |
| AUD-001 | Audit logs | Clinical write audit | MVP | High | High | High | Encounters, prescriptions, investigations, reports. |
| AUD-002 | Audit logs | Sensitive read and export audit | MVP | Medium | Critical | High | Profiles, reports, prescriptions, billing exports. |
| AUD-003 | Audit logs | Consent audit | MVP | High | High | Medium | Create, update, withdrawal, override. |
| AUD-004 | Audit logs | Billing audit | MVP | Low | High | Medium | Payments, refunds, reversals, discounts, voids. |
| AUD-005 | Audit logs | Admin and security audit | MVP | Medium | High | Medium | Users, roles, permissions, sessions, configuration. |
| AUD-006 | Audit logs | Audit review screen | MVP | Medium | High | Medium | Read-only for authorized auditors/admins. |
| AUD-007 | Audit logs | Tamper-evident audit storage | V1 | Medium | High | High | Beyond basic append-only application behavior. |
| BAK-001 | Backups | Database backup process | MVP | Medium | Critical | High | Document and implement before production use. |
| BAK-002 | Backups | Report file storage backup process | MVP | Medium | Critical | High | Required if uploaded files are enabled. |
| BAK-003 | Backups | Restore test checklist | MVP | Medium | Critical | Medium | Verify RBAC, audit logs, consent, billing, report metadata and files. |
| BAK-004 | Backups | Backup run metadata | MVP | Medium | High | Medium | Do not store backup files in repository. |
| BAK-005 | Backups | Backup failure alerting | V1 | Medium | High | Medium | Needs notification channel decisions. |
| SEC-001 | Security | Secret-free repository | MVP | Medium | Critical | Medium | `.env.example` placeholders only. |
| SEC-002 | Security | Server-side authorization | MVP | High | Critical | High | UI hiding is never sufficient. |
| SEC-003 | Security | Privacy-safe logs | MVP | Medium | Critical | Medium | No clinical note bodies, report contents, secrets, tokens, or payment secrets. |
| SEC-004 | Security | Secure file access for reports | MVP | High | Critical | High | No direct unauthenticated object URLs. |
| SEC-005 | Security | Environment configuration documentation | MVP | Medium | High | Medium | Real values only in secret managers or local env. |
| SEC-006 | Security | Account lockout or throttling | MVP | Medium | High | Medium | Protect staff login. |
| SEC-007 | Security | Encrypted transport in deployment | MVP | Medium | High | Medium | Deployment requirement before real use. |
| AI-001 | AI draft-only features | AI safety boundary documentation | MVP | High | High | Low | Document now; do not build AI in MVP. |
| AI-002 | AI draft-only features | AI encounter note draft | Future | High | Critical | High | Doctor review and approval required. |
| AI-003 | AI draft-only features | AI patient summary draft | Future | High | Critical | High | Minimum necessary context only. |
| AI-004 | AI draft-only features | AI report summary draft | Future | High | Critical | High | No final interpretation without doctor approval. |
| AI-005 | AI draft-only features | AI patient instruction draft | Future | High | Critical | High | Must not become patient-facing until doctor approved. |
| AI-006 | AI draft-only features | AI approval workflow and audit | Future | High | Critical | High | Store draft status, model, prompt version, reviewer, decision. |
| AI-007 | AI draft-only features | Autonomous diagnosis or prescribing | Future | Critical | Critical | High | Prohibited; listed only as a guardrail. |

## MVP Definition of Done
- All MVP features enforce authentication and server-side authorization.
- Clinical record changes, sensitive report actions, consent changes, billing adjustments, user/role changes, backup runs, and restore tests are audit logged.
- Reports are stored outside the repository with database metadata only.
- Billing records do not store card numbers, payment secrets, or unnecessary clinical detail.
- Backups and restore tests are documented before any real clinic use.
- AI features are not required for MVP and cannot write final clinical content without later doctor approval workflow.

## V1 Priorities
- Prescription print/export with strict formatting and audit controls.
- Appointment reminders after communication consent decisions.
- Doctor availability templates and blocked time.
- Structured OB/GYN templates reviewed by a clinical owner.
- MFA for admin and doctor accounts.
- Exportable operational reports with audit logs.
- Backup failure alerting.

## V2 Priorities
- Direct lab, radiology, ultrasound, pathology, and cytology integrations.
- Payment gateway integration.
- Advanced reporting and analytics.
- Recurring appointments.
- Medication favorites with safety constraints.

## Future Guardrails
- AI features must remain draft-only.
- AI clinical output must be visibly labeled and require explicit doctor approval.
- No AI diagnosis, autonomous prescribing, or final clinical interpretation.
- No real patient data may be used in examples, tests, prompts, or fixtures unless a formally approved privacy and consent process exists.
