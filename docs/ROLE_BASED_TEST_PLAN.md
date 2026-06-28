# Role-Based Test Plan

This plan complements `docs/ROLE_PERMISSION_MATRIX.md` and `docs/RBAC_MATRIX.md`. It is for V0.1 staging/demo QA only and does not certify production security.

## Test Setup

- Use seeded demo users only.
- Use synthetic demo patient records only.
- Keep AI disabled/mock-only.
- Run the automated role and route tests before manual QA:

```powershell
npm run test:routes:auth
npm run test:scope:records
npm run test:audit:assertions
npm run test:ai:regression
npm run test:security:expanded
```

## Role Matrix

| Role | Login expectation | Allowed modules | Denied modules/actions | Audit expectation | Known demo limitations |
| --- | --- | --- | --- | --- | --- |
| Owner | Can login with seeded owner account. | All V0.1 modules, admin, audit, billing, AI draft placeholders. | None for demo owner positive-control paths. | Representative writes/status/sign/review/payment actions audited. | Owner is broad for local demo and is not a production least-privilege model. |
| Admin | Can login if seeded. | Admin areas and broad operational access where seeded. | Clinical authority is not implied unless explicit permissions exist. | Admin/audit-sensitive actions should be logged. | Admin split into clinic/security/billing admins remains future work. |
| Doctor | Can login with seeded doctor account. | Clinical modules, branch/doctor-scoped records where allowed. | Billing management, reception-only queue actions, admin/audit unless granted. | Encounter, prescription, investigation, report, pregnancy, OB ultrasound actions audited. | Patient-to-doctor assignment is not fully modeled; patient reads are branch-scoped. |
| Nurse | Can login with seeded nurse account. | Queue/support workflows where allowed. | Billing, AI review, clinical signing, admin/audit. | Queue and support actions audited where implemented. | Nurse prep-note module is not a full production workflow yet. |
| Receptionist | Can login with seeded receptionist account. | Patients, consents, appointments, queue where allowed. | Encounters, prescriptions, reports, audit/admin, AI review. | Registration, consent, appointment, and queue actions audited. | Full consent legal workflow and override handling remain incomplete. |
| Accountant | Can login with seeded accountant account. | Billing/invoices/payments where allowed. | Clinical modules, reports, AI drafts, admin/audit unless granted. | Invoice/payment/reversal actions audited. | No real payment gateway, card data, refunds, or settlement workflow. |

## Route Permission Expectations

- Anonymous requests to protected routes return `401` or equivalent safe denial.
- Owner access is used as the broad positive control in automated route tests.
- Lower-role denied examples must return `403` or another safe denial.
- Broad authenticated routes are documented warnings, not production completeness proof.
- Referenced-record writes must reject out-of-branch patient, appointment, encounter, invoice, consent, and AI draft references where implemented.

## Manual Scenarios

### Owner Scenario

1. Login as owner.
2. Visit dashboard and confirm all module links are visible.
3. Create a demo patient and consent.
4. Complete appointment, queue, encounter, prescription, investigation, report, OB ultrasound, billing, and AI placeholder workflow.
5. Check audit records for representative actions.

### Doctor Scenario

1. Login as doctor.
2. Confirm clinical pages load according to seeded permissions.
3. Confirm billing management is denied.
4. Confirm AI draft review is denied unless explicit permission exists.
5. Confirm no AI route can sign or update final records.

### Nurse Scenario

1. Login as nurse.
2. Confirm queue/support paths work where allowed.
3. Confirm billing and AI draft routes are denied.
4. Confirm signing encounter, prescription, or report is denied.

### Receptionist Scenario

1. Login as receptionist.
2. Register a synthetic demo patient.
3. Record demo consent.
4. Schedule appointment and check in queue.
5. Confirm clinical signing and audit/admin pages are denied.

### Accountant Scenario

1. Login as accountant.
2. Create or inspect demo invoices and payments where allowed.
3. Confirm clinical modules are denied.
4. Confirm no card numbers or gateway tokens are entered.

### Admin Scenario

1. Login as admin if seeded.
2. Verify administrative screens match seeded permissions.
3. Confirm clinical authority is still permission-based.
4. Confirm audit/admin access is logged or documented where implemented.

## Evidence To Capture

- Test command outputs.
- Git commit/tag under test.
- Browser page checklist results.
- Any `403`/`401` denial that differs from expected matrix.
- Any warning accepted as V0.1 limitation.

Do not capture screenshots containing real patient data, real credentials, or secrets.

