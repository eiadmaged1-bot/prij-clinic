# Architecture

## Current Phase
This project is in the documentation and planning phase. Do not build clinical features before requirements, architecture, database model, and security rules are reviewed.

## Architecture Goals
- Protect patient privacy from the first implementation.
- Keep clinical records auditable.
- Use role-based access control for every sensitive workflow.
- Separate operational clinic workflows from future AI-assisted draft features.
- Make backups, restore testing, and secure configuration first-class concerns.

## Proposed Application Shape
Initial implementation should use a conventional web application architecture:
- Web app for clinic staff and doctors.
- API/server layer for business rules, validation, RBAC, and audit logging.
- Relational database for clinical, billing, scheduling, and audit data.
- Object/file storage for uploaded reports only when required, with access controls and metadata in the database.
- Background jobs for backups, reminders, export tasks, and future non-clinical automation.

## Suggested Monorepo Layout
```text
apps/
  web/                 # Staff and doctor web interface
  api/                 # Server/API application
packages/
  shared/              # Shared types, validation schemas, constants
docs/                  # Product, architecture, security, and data model docs
```

This is a planning target, not a requirement to scaffold the app immediately.

## Core Modules
- Identity and access: users, roles, permissions, sessions, password policy.
- Patients: demographics, contacts, consent, profile summary.
- Appointments: scheduling, status, doctor calendar.
- Queue: daily visit flow and status tracking.
- Assistant/nurse preparation: vitals, rooming status, and prep notes where permitted.
- Encounters: doctor-owned clinical documentation, signing, and correction workflow.
- Prescriptions: medications, doctor approval metadata, cancellation/replacement workflow.
- Investigations: requests, status lifecycle, result metadata, doctor review status.
- Reports: uploaded or referenced clinical files with strict access checks for ultrasound, radiology/imaging, laboratory, pathology/cytology, procedure, external consultant, scanned, and patient-provided reports.
- Billing: invoices, line items, payments, refunds, balances.
- Audit: immutable event log for clinical writes, sensitive reads/exports, consent changes, billing changes, security/admin actions, backups, and restore tests.
- Backups: scheduled database and file/object storage backups with restore verification.

## MVP Integration Boundary
The MVP should support manual investigation and report workflows before direct external integrations.

MVP report handling should include:
- Manual report upload or secure reference metadata.
- Report source, type, receipt date, linked patient, linked encounter or investigation, and review status.
- Doctor review action and follow-up note where needed.
- Permission-controlled view, download/export, correction, void, and deletion workflows.

Later integration candidates include:
- Laboratory information systems.
- Radiology/imaging systems, PACS, and RIS.
- Pathology and cytology systems.
- Ultrasound or diagnostic device imports.
- Pharmacy, insurance, payment gateway, accounting, and patient portal systems.

Each integration must define authentication, authorization, consent, audit logging, error handling, data mapping, reconciliation, and rollback behavior before implementation.

## Data Boundaries
- Application code must not contain patient data.
- Logs must not contain full clinical notes, IDs, secrets, or tokens.
- Uploaded files must be stored outside the code repository.
- Demo and test fixtures must use clearly fake data only.

## Audit Logging Standard
Every sensitive action should write an audit event with:
- Actor user ID.
- Action name.
- Resource type and ID.
- Timestamp.
- Before/after summary where appropriate.
- Request/session metadata where safe.
- Reason or note for destructive or corrective actions.

Audit logs should be append-only for normal users and admins. Any exceptional maintenance operation must be separately logged.

Audit coverage should include:
- Clinical create, update, sign, correction, void, delete, and export.
- Report upload, view, download/export, review, correction, void, and delete.
- Consent create, update, withdrawal, override, and view where appropriate.
- Billing issue, payment, refund, reversal, discount, cancellation, and void.
- User, role, permission, session, backup, restore, and configuration changes.

Audit payloads should avoid duplicating full clinical notes or report contents unless a secure approved audit storage design is adopted.

## Backup and Recovery Boundary
- Database backups must cover operational records, clinical metadata, consent records, RBAC data, audit logs, billing data, investigation/report metadata, and backup metadata.
- File/object storage backups must cover uploaded reports if report files are stored outside the database.
- Restore tests must verify both data recovery and access-control behavior.
- Backup files and restored patient data must never be committed to the repository.

## Future AI Boundary
AI features belong in a later phase. When introduced, AI should be isolated behind a service boundary that:
- Accepts minimum necessary context.
- Produces draft-only output.
- Stores model, prompt version, reviewer, and approval status.
- Never writes final clinical records without doctor approval.
- Requires explicit doctor approval before any AI text is copied into signed clinical records, prescriptions, patient instructions, or follow-up plans.
- Audits draft creation, view, edit, approval, rejection, and final-record update.
