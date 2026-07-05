# Staging Browser QA Checklist

Run after migrations, seed, staging simulation, and build checks pass.

## Automated Browser-Facing Lock

```powershell
npm run test:v181:browser-qa-lock
```

Required routes:

- `/login`
- `/dashboard`
- `/clinic-day/walkthrough`
- `/patients`
- `/patients/new`
- `/reception`
- `/reception/check-in`
- `/reception/today`
- `/calendar`
- `/queue`
- `/doctor/waiting`
- `/doctor/visit`
- `/prescriptions`
- `/investigations`
- `/billing`
- `/reports`
- `/ai-assistant`
- `/ai-drafts`
- `/admin`
- `/admin/services`
- `/admin/security-readiness`
- `/admin/medication-safety-profiles`

## Manual Role Pass

- Owner/Admin: dashboard, admin pages, services, reports, security readiness, medication safety review, AI assistant review.
- Doctor: patient workspace, waiting room, visit, prescription, investigations, gynecology, pregnancy, ultrasound, AI draft-only tools.
- Receptionist: new patient, reception, check-in, queue, appointments/calendar, blocked from clinical AI and admin safety tools.
- Accountant: billing, payments, allowed reports, blocked from clinical AI and medication safety/admin clinical tools.

## Failure Conditions

- Raw JSON or stack trace appears in normal UI.
- Endpoint/schema/Prisma/JWT/RBAC wording appears as normal user copy.
- UI claims safe-in-pregnancy status without reviewed source governance.
- UI says external AI is enabled.
- UI suggests automatic diagnosis, prescribing, dosing, treatment ranking, or autonomous clinical action.
- Seed or demo warning implies real patient data is present.

