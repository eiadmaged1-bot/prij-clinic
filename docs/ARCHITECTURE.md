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
- Encounters: doctor-owned clinical documentation.
- Prescriptions: medications and doctor approval metadata.
- Investigations: requests, status, result references.
- Reports: uploaded or referenced clinical files with strict access checks.
- Billing: invoices, line items, payments, refunds, balances.
- Audit: immutable event log for sensitive reads/writes and admin actions.
- Backups: scheduled database backups and restore verification.

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

## Future AI Boundary
AI features belong in a later phase. When introduced, AI should be isolated behind a service boundary that:
- Accepts minimum necessary context.
- Produces draft-only output.
- Stores model, prompt version, reviewer, and approval status.
- Never writes final clinical records without doctor approval.
