# Pilot Release Manifest

Release: v1.0.0 Pilot Release Candidate

Branch: `release/v1.0.0-pilot-rc`

Expected tag: `v1.0.0-pilot-rc`

## Major Completed Modules

- Patients and patient profile.
- Appointments, queue, and doctor calendar.
- Encounters, prescriptions, investigations, reports, pregnancy, OB ultrasound, and clinical document workflows.
- Billing, manual payments, service catalog, patient statements, and daily closing foundations.
- Roles, permissions, RBAC checks, sessions, and audit logs.
- Backup readiness and staging deployment package.
- Browser QA lock and clinic walkthrough lock.
- Safe AI assistant draft workflow with doctor review and external AI disabled by default.

## Major Blocked Modules

- Real patient data use.
- External AI runtime calls.
- Autonomous diagnosis, prescribing, dosing, and treatment ranking.
- Real payment gateway.
- WhatsApp.
- DICOM/PACS.
- Insurance/TPA.
- Full accounting ledger.
- Mobile app.

## Environment Requirements

- Node/npm workspace dependencies installed.
- PostgreSQL available for local/staging verification.
- Secrets stored only in uncommitted environment files.
- Staging and production-shaped environments must use exact approved origins, managed secrets, HTTPS, and disabled external AI by default.

## Startup Commands

```powershell
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run dev
```

## Staging Smoke Commands

```powershell
npm run staging:simulate
npm run test:v180:staging-smoke
npm run test:v181:browser-qa-lock
```

## Backup Commands

```powershell
npm run test:v180:backup-staging-readiness
npm run test:v160:security-real-data-readiness
```

Backup artifacts must remain ignored and must not be committed.

## Manual QA Path

1. Run the automated gates in `docs/PILOT_QA_CHECKLIST.md`.
2. Complete role-by-role browser review with `docs/ROLE_BY_ROLE_BROWSER_QA.md`.
3. Complete staging browser review with `docs/STAGING_BROWSER_QA_CHECKLIST.md`.
4. Record any warnings before clinic pilot use.

## Known Warnings

- Manual role-by-role browser signoff remains required.
- Local/demo seed data is synthetic only.
- Backup readiness still requires a real controlled restore drill before real patient data.
- Browser/source checks do not replace legal, privacy, deployment, and operational signoff.

## Safety Statements

Real patient data is prohibited in this release candidate until legal/privacy, backup/restore, deployment, and role-by-role signoff are complete.

External AI is disabled by default. AI is assistive, draft-only, and doctor-approved. It does not autonomously diagnose, prescribe, dose, rank treatment, or write final clinical records.
