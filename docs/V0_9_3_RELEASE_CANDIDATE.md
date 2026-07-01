# v0.9.3 Release Candidate Pack

Sprint: v0.9.3 Release Candidate Pack

Current branch: `hardening/v0.9.3-automated-qa-stabilization`

Release-candidate base commit before this QA pack: `5b65630d39a6af035eaa089a1db54584243e7f92`

Latest pushed QA-pack commit is the commit containing this document; confirm with:

```powershell
git rev-parse HEAD
```

## Gate Status

- CI Release Gate: passed.
- Normal CI: passed.
- Release tag: not created yet.
- Tag status: blocked until final local Docker/PostgreSQL validation and manual browser QA both pass.

## Why The Tag Is Still Blocked

The GitHub checks prove the branch can pass automated CI, including the v0.9.3 Release Gate. They do not replace final owner-controlled local validation on the release machine.

The tag remains blocked until:

1. Docker Desktop is running locally.
2. PostgreSQL is reachable locally.
3. The final release validation command passes without `V093_ALLOW_ENV_SKIP=1`.
4. Manual browser QA passes for the documented routes and roles.

Do not create or push a release tag before those checks pass.

## Final Local Validation Commands

Run these after returning home and starting Docker Desktop:

```powershell
npm run dev:diagnose
npm run test:v093:release
```

Do not use `V093_ALLOW_ENV_SKIP=1` to claim release validation.

## Manual Browser QA Routes

Use fake/demo data only.

- `http://localhost:3000/login`
- `http://localhost:3000/dashboard`
- `http://localhost:3000/patients`
- `http://localhost:3000/patients/new`
- `http://localhost:3000/patients/:id`
- `http://localhost:3000/calendar`
- `http://localhost:3000/appointments`
- `http://localhost:3000/queue`
- `http://localhost:3000/doctor`
- `http://localhost:3000/doctor/visit`
- `http://localhost:3000/billing`
- `http://localhost:3000/finance`
- `http://localhost:3000/orders`
- `http://localhost:3000/investigations`
- `http://localhost:3000/reports`
- `http://localhost:3000/medications`
- `http://localhost:3000/medications/search`
- `http://localhost:3000/medications/safety`
- `http://localhost:3000/drug-market`
- `http://localhost:3000/drug-market/search`
- `http://localhost:3000/admin`
- `http://localhost:3000/admin/accounts`
- `http://localhost:3000/admin/medications`
- `http://localhost:3000/admin/drug-market`
- `http://localhost:3000/admin/drug-market/automation`
- `http://localhost:3000/admin/drug-market/review-queue`
- `http://localhost:3000/admin/protocol-atlas`
- `http://localhost:3000/admin/calculators`
- `http://localhost:3000/ai-drafts`
- `http://localhost:3000/calculators`

## Role-Based QA Checklist

Run role checks with seeded demo accounts only:

- Owner/Admin: can see admin, owner controls, role/account management, drug-market admin/review/automation, medication safety/admin, guideline/protocol admin, finance, clinical workflow pages, and audit-facing controls.
- Doctor: can see dashboard, patients, patient workspace, calendar, queue as appropriate, doctor workspace, encounters, prescriptions, investigations, reports, medications, guidelines/protocols, calculators if allowed, and draft-only AI support if allowed.
- Nurse: can see assigned clinical workflow support pages such as dashboard, patients, queue, investigations/orders, reports, and medication reference as allowed; must not see privileged admin/owner controls.
- Receptionist: can see dashboard, patients, new patient creation, appointments/calendar, queue, and limited billing workflow if allowed; must not see clinical admin, medication automation, AI draft review, or owner-only controls.
- Accountant: can see billing/finance, patient statements, payments, and reports as allowed; must not see clinical admin, medication automation, AI draft review, guideline admin, or owner-only controls.

For every non-authorized role, verify direct navigation is denied for:

- `/admin`
- `/admin/drug-market`
- `/admin/drug-market/automation`
- `/admin/drug-market/review-queue`
- `/admin/medications`
- `/medications/safety`
- `/admin/protocol-atlas`
- `/ai-drafts` when restricted
- `/admin/calculators` when restricted

## Release Command After Everything Passes

Run only after final local validation and manual browser QA both pass:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/v093-release-commands.ps1 -RequireAllChecksPassed
```

## Safety Reminders

- No real patient data.
- No real payment gateway.
- No external AI.
- No autonomous prescribing.
- No market strength/form as patient dosing.
- AI clinical output remains draft-only until reviewed and approved by a doctor.
- Clinical record changes must remain audit-loggable.
