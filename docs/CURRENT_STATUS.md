# Current Status

Date: 2026-06-29

Branch: `verify/obgyn-v02-workflow-polish-after-accounts`

Base branch: `auth/accounts-session-rbac-hardening`

Target tag: `v0.2-obgyn-workflow-verified-after-accounts`

## Status Summary

Prij Clinic has verified and polished the OB/GYN Specialty Engine v0.2 workflow after the accounts/session hardening sprint. This state combines:

- Backend OB/GYN core depth from `v0.2-obgyn-specialty-engine`.
- Stable `/auth/me` session identity, persistent user menu, protected `eyad` System Owner account, and `/admin/accounts` from `v0.2-accounts-session-rbac`.
- A connected patient-file Pregnancy workspace for pregnancy episode, previous pregnancy history, fetus records, antenatal visits, ultrasound drafts, timeline, and print-friendly summaries.
- Existing V0.1 operational workflows, route security, doctor-friendly UI, local staging prep, and fake/demo-only verification.

This remains local/demo software only. It is not production-ready, not a medical device, and must not be used with real patient data, real payment data, PHI uploads, external AI providers, or live clinical workflows.

## Integrated OB/GYN v0.2 Scope

Backend depth preserved from Codex A:

- Prisma migration `apps/api/prisma/migrations/20260629113000_obgyn_core_depth_backend/migration.sql`.
- Pregnancy episode depth with recording-only risk flags and active/inactive/ended-style status support.
- Previous pregnancy history API/model support.
- Fetus and multiple pregnancy support.
- Deeper antenatal visit recording fields.
- Deeper OB ultrasound recording fields linked to patient, pregnancy, fetus, and encounter where supported.
- OB/GYN events in the patient timeline.
- Dedicated `scripts/obgyn-core-depth-test.mjs` and `npm run test:obgyn:core`.
- `docs/OBGYN_CORE_DEPTH.md`.

Frontend/reporting UX verified and polished:

- Patient-file Pregnancy workspace with Pregnancy Overview, Obstetric History, Fetus Records, Antenatal Visits, Ultrasound, Timeline integration, Investigations, Reports, and Follow-up.
- Pregnancy dashboard showing LMP, EDD, dating method, gravida/para, status, visit prompts, ultrasound summary, and notes.
- Connected antenatal visit UX form with grouped visit details, vitals, pregnancy checks, clinician notes, plan, investigations, and next follow-up.
- Connected OB ultrasound report builder UI with recording-only scan details, fetus/pregnancy context, presentation, placenta, amniotic fluid, fetal heart, biometry, Doppler note placeholder, and doctor-written impression.
- Print-friendly browser summaries for patient summary, antenatal visit summary, ultrasound draft, and report cards.
- OB/GYN doctor workflow templates.
- Visual/doctor UX test updates plus `scripts/obgyn-workflow-verification-test.mjs`.
- `docs/OBGYN_UX_GUIDE.md`.

## Existing Foundation

- Auth: local staff login, JWT cookie/bearer support, account lockout after repeated failures, logout audit.
- RBAC: seeded roles and permissions with server-side permission guards on protected controllers.
- Scope filtering: branch scope for non-owner/non-admin reads and referenced-record writes where supported; doctor scope for doctor-owned records where relevant.
- Audit: append-only audit table and metadata-only audit hooks for implemented create/update/status/sign/review/payment and sensitive read actions.
- MVP modules: patients, appointments, queue, encounters, prescriptions, investigations, reports, pregnancies, OB ultrasound, billing, payments, dashboard, consents, admin, and AI draft placeholders.
- Admin Control Center: local admin login `eyad` / `eyad`, users/roles overview, service catalog and price editing, system safety status, audit viewer, and reason-required override endpoints.
- Theme system: Original Premium, Clinic Portal, Incision Portal, Minimal Clean, and Compact Operations appearances.
- Accounts/session hardening: `/auth/me` driven app identity, persistent user menu, reliable logout, login already-signed-in state, `/admin/accounts`, permission presets/toggles, and protected `eyad` System Owner metadata.
- Doctor-friendly UX: `/doctor` daily workspace, guided visit steps, simplified patient file, 3D medical icons, comfortable/large/compact display preferences, and mobile/tablet responsive polish.
- Patient-context workflow actions under `/patients/:id`.
- Patient timeline aggregation with OB/GYN event coverage after this integration.
- VPS staging checklist, bootstrap script, safe deploy script, remote smoke-test variables, and VPS backup procedure remain prepared for a future real server trial.

## Safety State

- Seed data and automated tests use fake/demo-only records.
- No real AI API calls or provider SDK usage are implemented.
- AI draft artifacts are disabled/mock-only and cannot update final clinical records.
- OB ultrasound and pregnancy records do not calculate diagnoses, fetal risk, FGR, or fetal-image analysis.
- OB/GYN UX labels measurements as recording-only and requires clinician interpretation.
- Payment records are demo metadata only and do not use a real payment gateway.
- Report/file workflows remain metadata/placeholder only; no PHI upload is enabled.
- The protected `eyad` account is the only seeded System Owner. Reserved System Owner permissions cannot be granted to other accounts through normal UI/API flows.

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
npm run test:obgyn:workflow
npm run test:accounts:rbac
npm run test:visual:qa
npm run test:staging:smoke
npm run staging:env:check
```

## Commit Safety

Before commit, ensure these are not staged:

- `.env`
- `apps/api/.env`
- `.env.staging`
- `.env.production`
- Any `*.tsbuildinfo`
- Logs
- Uploads
- Backups
- Local database files
- Screenshots
- Secrets, API keys, tokens, or patient data
