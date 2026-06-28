# Pilot QA Checklist

Date: 2026-06-28

This checklist is for controlled V0.1 staging/demo QA only. Do not use real patient data, PHI files, real payment details, real AI provider access, or production clinic credentials.

## Before QA

- Confirm the branch/tag under test is documented in `docs/CURRENT_STATUS.md`.
- Run `npm run prisma:migrate:deploy` for staging or `npm run prisma:seed` for local demo setup.
- Confirm `AI_FEATURES_ENABLED=false` and `AI_PROVIDER=disabled`.
- Confirm `.env`, `apps/api/.env`, uploads, logs, backups, and local database files are not staged in Git.
- Run `npm run smoke:test`, `npm run test:security:expanded`, and `npm run test:e2e:v01`.
- Use seeded demo users only.

## Demo Workflow

| Step | Primary role | Expected result | Audit expectation |
| --- | --- | --- | --- |
| Login | Owner, Admin, Doctor, Nurse, Receptionist, Accountant | Seeded demo user can sign in; unauthorized credentials fail safely. | Failed login risk events should avoid passwords. |
| Register patient | Receptionist or Owner | Demo patient can be created with synthetic identifiers only. | `patient.created` metadata exists. |
| Record consent | Receptionist or Owner | Demo consent can be recorded for in-scope demo patient. | `consent.created` metadata exists without legal text or secrets. |
| Schedule appointment | Receptionist or Owner | Appointment links to in-scope demo patient. | `appointment.created` metadata exists. |
| Queue check-in | Receptionist or Nurse | Queue ticket is created for today. | `queue.checked_in` metadata exists. |
| Open encounter | Doctor or Owner | Encounter draft can be created for in-scope demo patient. | `encounter.created` metadata exists. |
| Create prescription | Doctor or Owner | Prescription draft can be created; signing requires permission. | `prescription.created` and signing audit where tested. |
| Create investigation order | Doctor or Owner | Investigation order can be created for in-scope demo patient. | `investigation_order.created` metadata exists. |
| Create report metadata | Doctor or Owner | Report metadata/reference only; no real file upload. | `report.created` and review audit where tested. |
| Create OB ultrasound record | Doctor or Owner | Manual record can be created without diagnostic automation. | `ob_ultrasound.created` metadata exists. |
| Create invoice/payment | Accountant or Owner | Demo invoice/payment can be recorded without card data or gateway calls. | `invoice.created`, `invoice.issued`, and `payment.recorded` metadata exists. |
| Review AI draft placeholder | Owner or permitted reviewer | Disabled/mock draft can be reviewed; no final clinical record update occurs. | AI draft review audit confirms no clinical insertion. |

## Role Checks

### Owner

- Can access dashboard, admin, audit, patients, consents, appointments, queue, clinical modules, billing, and AI draft placeholders.
- Can run the full demo workflow.
- Verify audit entries are created for representative create/status/sign/review/payment actions.
- Confirm AI remains disabled/mock-only.

### Admin

- Can access administrative areas where seeded permissions allow.
- Should not be treated as production clinical authority without explicit clinical permissions.
- Confirm any denied clinical or billing paths fail with `403` where applicable.
- Confirm audit review access follows seeded role permissions.

### Doctor

- Can access clinical modules where seeded permissions allow: patients, encounters, prescriptions, investigations, reports, pregnancies, OB ultrasound.
- Cannot manage billing unless intentionally granted.
- Cannot bypass branch scope or patient reference scope.
- Cannot use AI to prescribe, diagnose, sign, or update final records.

### Nurse

- Can access queue/clinical support paths where seeded permissions allow.
- Cannot manage billing.
- Cannot sign encounters, prescriptions, or reports.
- Cannot review AI drafts without permission.
- Confirm out-of-branch patient reads and referenced-record writes are denied.

### Receptionist

- Can manage registration, consent intake, appointments, and queue where seeded permissions allow.
- Cannot manage clinical encounters, prescriptions, reports, or audit logs.
- Cannot reference out-of-branch patients.
- Confirm registration and appointment actions are audited.

### Accountant

- Can access billing/invoice/payment paths where seeded permissions allow.
- Cannot manage clinical records, reports, pregnancies, OB ultrasound, or AI drafts.
- Cannot access audit/admin paths without explicit permissions.
- Confirm no real card numbers, gateway tokens, or payment secrets are entered.

## UI Page Checklist

- `/` shows staging/demo warning, workflow links, and module links.
- `/login` shows seeded-role context and no real credential warning.
- `/dashboard` shows user context, summary metrics, safety warning, and workflow links.
- `/patients` and `/patients/new` load protected API data or show login-required state.
- `/consents` loads consent foundation data and safe demo form.
- `/appointments` and `/calendar` load schedule data.
- `/queue` loads today queue data.
- `/encounters`, `/prescriptions`, `/investigations`, `/reports`, `/pregnancies`, and `/ultrasound` show clinical module warnings and protected data.
- `/billing` shows billing module restrictions and no real payment gateway warning.
- `/ai-drafts` clearly states disabled/mock-only, draft-review-only behavior.

## Pass Criteria

- No real patient data, real files, real payment data, real credentials, or real AI calls are used.
- All baseline automated tests pass.
- Documented warnings remain understood and accepted for V0.1.
- Any usability issue is logged for V0.2 unless it blocks the controlled demo.

