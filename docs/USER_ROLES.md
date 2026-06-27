# User Roles

## RBAC Principles
- Every user must authenticate.
- Every protected action must be authorized on the server.
- Roles are collections of explicit permissions.
- Users may have more than one role, but permissions should remain least-privilege.
- Clinic or branch scope must restrict access where multiple branches or locations exist.
- Administrative access does not automatically grant unrestricted clinical access.
- Sensitive reads, exports, clinical changes, consent changes, billing adjustments, and admin changes must be audit logged.

## Initial Roles
| Role | Purpose | Default scope |
| --- | --- | --- |
| Admin | Manage users, roles, permissions, clinic settings, backups, and audit review. | Clinic or branch scope as configured. |
| Doctor | Provide care, review patient profiles, create and sign encounters, approve prescriptions, request investigations, and review reports. | Assigned patients, appointments, encounters, doctor calendar, and permitted clinic scope. |
| Receptionist | Register patients, manage appointments, update queue, and support front-desk workflows. | Front-desk records in assigned clinic or branch. |
| Nurse or assistant | Manage queue preparation, record vitals and preparation notes, and support clinical workflow where permitted. | Assigned queue and permitted patient preparation data. |
| Billing | Create invoices, record payments, process permitted adjustments, and view billing reports. | Billing records in assigned clinic or branch. |
| Read-only auditor | Review audit logs and permitted records for accountability. | Audit and reporting scope only; no normal write access. |
| System owner | Maintain infrastructure, deployment, secrets, backups, and recovery posture. | Operational systems; application access should still use explicit permissions. |

## Permission Groups
| Group | Example permissions | Notes |
| --- | --- | --- |
| Patient | `patient.read`, `patient.create`, `patient.update` | Patient access should be minimum necessary and scope-limited. |
| Consent | `patient.consent_read`, `patient.consent_manage`, `patient.consent_override` | Override requires reason and audit log. |
| Appointment | `appointment.read`, `appointment.manage`, `appointment.cancel`, `appointment.no_show` | Calendar visibility follows doctor, branch, and role scope. |
| Queue | `queue.read`, `queue.manage`, `queue.status_update` | Queue priority is operational only, not emergency triage. |
| Preparation | `vitals.create`, `prep_note.create`, `prep_note.read` | Assistant/nurse notes remain separate from doctor notes. |
| Encounter | `encounter.read`, `encounter.create`, `encounter.update_own`, `encounter.sign`, `encounter.correct_signed`, `encounter.export` | Signed correction must be versioned or appended. |
| Prescription | `prescription.read`, `prescription.create`, `prescription.update`, `prescription.approve`, `prescription.cancel`, `prescription.export` | Approval is doctor-only. |
| Investigation | `investigation.read`, `investigation.create`, `investigation.update`, `investigation.cancel`, `investigation.review` | Review is doctor-led. |
| Report | `report.read`, `report.upload`, `report.update`, `report.review`, `report.export`, `report.void`, `report.delete` | Export/download is separate from read. |
| Billing | `billing.read`, `billing.manage`, `payment.manage`, `billing.adjust`, `billing.void`, `billing.report` | No card numbers or payment secrets. |
| Admin | `user.manage`, `role.manage`, `clinic_settings.manage`, `branch.manage` | Changes are audit logged. |
| Audit | `audit.read`, `audit.export` | Audit logs are read-only through normal workflows. |
| Backup | `backup.manage`, `restore_test.manage`, `backup.metadata_read` | Backup files never go in the repository. |
| Security | `security.review`, `session.manage`, `config.read_safe` | No secrets exposed in app screens or logs. |
| AI draft | `ai_draft.request`, `ai_draft.read`, `ai_draft.review`, `ai_draft.approve`, `ai_draft.reject` | Future only; doctor approval required for clinical use. |

## Role-Permission Matrix
| Capability | Admin | Doctor | Receptionist | Nurse/Assistant | Billing | Auditor | System owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Patient search/read | Conditional | Yes | Yes | Limited | Limited | Limited | No by default |
| Patient create/update | Conditional | Limited | Yes | No | No | No | No |
| Consent read/manage | Conditional | Read/limited manage | Manage intake consent | Read limited | No | Read limited | No |
| Consent override | Explicit only | Explicit only | No | No | No | No | No |
| Appointment manage | Conditional | Limited | Yes | Limited status only | No | Read limited | No |
| Queue manage | Conditional | Limited | Yes | Yes | No | Read limited | No |
| Doctor calendar | Conditional | Own/permitted | Scheduling view | Limited | No | Read limited | No |
| Prep notes/vitals | No by default | Read | No | Create/update own | No | Read limited | No |
| Encounter create/update | No by default | Yes | No | No | No | Read limited | No |
| Encounter sign/correct | No by default | Yes | No | No | No | Read limited | No |
| Prescription create/update | No by default | Yes | No | No | No | Read limited | No |
| Prescription approve | No | Yes | No | No | No | No | No |
| Investigation request/update | Conditional | Yes | Limited status | Limited status | No | Read limited | No |
| Report upload/reference | Conditional | Yes | Limited | Limited | No | Read limited | No |
| Report review | No by default | Yes | No | No | No | Read limited | No |
| Report download/export | Explicit only | Explicit only | Explicit only | Explicit only | No by default | Explicit only | No |
| Invoice create/manage | Conditional | Limited read | Limited | No | Yes | Read limited | No |
| Payment record/manage | Conditional | No | Yes if allowed | No | Yes | Read limited | No |
| Discounts/refunds/voids | Explicit only | No | Explicit only | No | Explicit only | Read limited | No |
| Operational dashboard | Yes | Own/permitted | Front desk | Queue/prep | Billing | Read limited | No |
| User/role management | Yes | No | No | No | No | No | No |
| Audit review | Yes | No by default | No | No | No | Yes | Conditional |
| Backup metadata | Yes | No | No | No | No | Read limited | Yes |
| Backup/restore operations | Explicit only | No | No | No | No | No | Yes |
| Security configuration | Explicit only | No | No | No | No | Read limited | Yes |
| AI draft request | Future explicit | Future explicit | No by default | No by default | No | No | No |
| AI draft approval | No | Future doctor-only | No | No | No | No | No |

Conditional means the role may receive the permission only when there is a specific operational reason.

## Clinical Safety Boundaries
- Doctors own final clinical documentation.
- Assistant and nurse preparation notes must be visually and structurally separate from doctor notes.
- Prescription approval is doctor-only.
- Investigation and report review are doctor-led.
- Administrative users should not edit clinical conclusions unless they also have an explicit clinical role and permission.
- AI drafts cannot become final clinical records without explicit doctor approval in a later phase.

## Privacy Boundaries
- Patient profile, report, prescription, billing, and export access should be separately controlled.
- Report files are high-sensitivity objects and require strict access checks.
- Download/export permissions are not implied by view permissions.
- Logs must not include full clinical notes, report contents, passwords, tokens, or payment secrets.
- Screenshots and demo data must use fake data only.

## Audit Requirements by Role
| Role | High-priority audit events |
| --- | --- |
| Admin | User, role, permission, configuration, audit review, backup metadata, restore test actions. |
| Doctor | Encounter create/update/sign/correction, prescription approval/cancel/void, investigation request, report review, clinical exports. |
| Receptionist | Patient create/update, appointment changes, queue changes, consent updates, payment entries if permitted. |
| Nurse or assistant | Queue status, vitals, preparation notes, document receipt status. |
| Billing | Invoice issue, payment, refund, reversal, discount, void, billing export. |
| Read-only auditor | Audit searches, audit exports, sensitive record views. |
| System owner | Backup, restore, deployment, secret rotation metadata, security configuration changes. |

## Future Role Decisions
- Whether to split Admin into clinic admin, security admin, and billing admin.
- Whether to add branch manager role.
- Whether to add doctor assistant role separate from nurse.
- Whether to add external accountant role with billing-only exports.
- Whether to support emergency or break-glass access; if added, it must require reason and high-severity audit logging.
