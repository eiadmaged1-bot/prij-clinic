# Current Status

Date: 2026-06-29

Branch: `leap/a-obgyn-core-depth`

Base tag: `v0.1-mvp-release-candidate-verified`

Target tag: pending

## Status Summary

Prij Clinic V0.1 is now a verified local/private MVP release-candidate foundation. It combines operational clinical persistence and OB/GYN core data recording with release-candidate UX polish, mobile/tablet improvements, visual QA, and demo documentation.

This sprint deepens the OB/GYN backend with fake/demo data only. It builds on the verified local/VPS staging-prep baseline. It is not production-ready and must not be used with real patient data, real payment data, PHI report files, real AI provider access, or live clinical workflows.

## Staging Prep Added

- Environment examples for local, API, web, staging, and production placeholders.
- Startup environment validation for required DB/JWT settings, disabled AI, stronger staging/production JWT secret, and production demo credential rejection.
- Production seed behavior now skips demo users, `eyad` login, demo patients, demo workflow records, demo billing, and demo AI drafts.
- API/web Dockerfiles, staging compose file, production compose example, and nginx reverse-proxy example.
- Database deployment workflows, staging backup/restore procedure, security hardening checklist, staging runbook, operations monitoring plan, and release gate checklist.
- Local backup script verified on 2026-06-29.
- Local staging compose trial verified API/Web Docker builds, migration deploy, explicit staging demo seed, health endpoints, staging smoke test, and staging backup helper on 2026-06-29.
- VPS staging checklist, bootstrap script, safe deploy script, remote smoke-test variables, and VPS backup procedure are prepared for the real server trial.

## Implemented Foundation

- Auth: local staff login, JWT cookie/bearer support, account lockout after repeated failures, logout audit.
- RBAC: seeded roles and permissions with server-side permission guards on protected controllers.
- Scope filtering: branch scope for non-owner/non-admin reads and referenced-record writes where supported; doctor scope for doctor-owned records where relevant.
- Audit: append-only audit table and metadata-only audit hooks for implemented create/update/status/sign/review/payment and sensitive read actions.
- MVP modules: patients, appointments, queue, encounters, prescriptions, investigations, reports, pregnancies, OB ultrasound, billing, payments, dashboard, consents, admin, and AI draft placeholders.
- Admin Control Center: local admin login `eyad` / `eyad`, users/roles overview, service catalog and price editing, system safety status, audit viewer, and reason-required override endpoints.
- Theme system: Original Premium, Clinic Portal, Incision Portal, Minimal Clean, and Compact Operations appearances.
- Doctor-friendly UX: `/doctor` daily workspace, guided visit steps, simplified patient file, 3D medical icons, comfortable/large/compact display preferences, and mobile/tablet responsive polish.
- Guided visit persistence: `/doctor/visit?patientId=...` creates or updates a structured encounter draft with complaint, history, examination, assessment/impression, and plan text.
- Patient-context workflow actions: `/patients/:id` can create appointment, queue check-in, encounter, prescription, investigation order, report placeholder, ultrasound draft, invoice, payment, and consent records with the patient carried automatically.
- Patient timeline aggregation: `GET /patients/:id/timeline` aggregates available patient journey events across core MVP records.
- OB/GYN core persistence: pregnancy episodes support living, abortions, LMP/EDD, dating method, active/inactive/ended-style statuses, recording-only risk flags, previous pregnancy history, fetus/multiple pregnancy records, deeper antenatal visits, OB ultrasound recording fields, and OB timeline events.
- Visual QA: `npm run test:visual:qa` checks friendly UI wording, layout availability, patient-file tabs, doctor cards, and admin appearance protection.
- Clinical persistence QA: `npm run test:clinical:persistence` checks patient-context workflow creation, signed encounter edit protection, OB/GYN recording-only behavior, timeline aggregation, and audit entries.
- Release-candidate verification planning: `docs/MVP_RC_VERIFICATION_CHECKLIST.md` and `docs/PRODUCTION_READINESS_PLAN.md` define the final demo checks and the gates before staging, pilot, or production.

## Safety State

- Seed data and automated tests use fake/demo-only records.
- No real AI API calls or provider SDK usage are implemented.
- AI draft artifacts are marked `disabled_mock` / `no_external_ai`.
- AI draft review cannot update final clinical records.
- OB ultrasound and pregnancy records do not calculate diagnoses, fetal risk, FGR, or fetal-image analysis.
- Payment records are demo metadata only and do not use a real payment gateway.
- Report/file workflows remain metadata/placeholder only; no PHI upload is enabled.

## Local Verification

Recommended full local sequence:

```powershell
npm run dev:stop
npm run prisma:repair
npm run prisma:seed
npm run typecheck
npm run build
npm run test:security:ci
npm run test:security:expanded
npm run test:theme:ui
npm run test:doctor:ux
npm run test:e2e:v01
npm run test:clinical:persistence
npm run test:obgyn:core
npm run test:visual:qa
npm run test:staging:smoke
npm run staging:env:check
```

## UI Safety State

- The app shell shows compact demo/local warnings and AI disabled status.
- Login shows local demo credentials, including `eyad` / `eyad` for Owner/Admin demo use only.
- Patient file creation redirects to `/patients/:id` after a successful API save.
- Patient file action forms post directly to patient-scoped APIs and return friendly save/error messages.
- Patient file tabs stay focused on the active patient.
- Normal-user UI avoids raw JSON, stack traces, endpoint labels, framework/database wording, and technical implementation labels.
- Admin and Appearance navigation is hidden from non-admin users, and backend admin routes reject non-admin access.
- Admin override endpoints require reason and audit; audit logs and signed clinical records cannot be silently hard-deleted from the normal UI/API.

## Commit Safety

Before commit, ensure these are not staged:

- `.env`
- `apps/api/.env`
- Any `*.tsbuildinfo`
- Logs
- Uploads
- Backups
- Local database files
- Secrets, API keys, tokens, or patient data
