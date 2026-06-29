# Current Status

Date: 2026-06-29

Branch: `leap/b-general-gynecology-starter`

Base branch: `pilot/mvp-obgyn-workflow-lock` at `a4b22c6`

Target tag: `v0.3-general-gynecology-starter`

## Status Summary

Prij Clinic now adds the first general gynecology starter layer on top of the locked MVP pilot OB/GYN workflow. The app is no longer pregnancy-only, while the new templates remain recording-only and doctor-led.

The intended pilot flow is now:

```text
Owner login -> patient file -> doctor workflow -> General Gynecology or Pregnancy/OB -> timeline -> print -> role-safe account behavior
```

This work combines:

- Codex A backend OB/GYN core depth.
- Codex B browser OB/GYN workspace, reporting UX, templates, and print-friendly summaries, now polished into a single patient-file workflow.
- Existing V0.1 operational workflows, route security, doctor-friendly UI, local staging prep, and fake/demo-only verification.
- General gynecology starter workspace, structured visit template, problem-focused starter templates, timeline events, and print summary.

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

Frontend/reporting UX preserved from Codex B:

- Patient-file Pregnancy workspace with Pregnancy Overview, Obstetric History, Antenatal Visits, Ultrasound, Investigations, Reports, and Follow-up.
- Pregnancy dashboard showing LMP, EDD, dating method, gravida/para, status, visit prompts, ultrasound summary, and notes.
- Antenatal visit UX form.
- Antenatal visit UX form grouped by visit details, maternal observations, symptoms, examination, fetal observations, plan, and next follow-up; it saves through the pregnancy antenatal visit API when a pregnancy episode exists.
- OB ultrasound report builder UI grouped by scan details, pregnancy/fetus context, presentation, placenta, amniotic fluid, fetal heart, biometry recording, Doppler note, and doctor-written impression.
- Print-friendly browser summaries for patient summary, antenatal visit summary, ultrasound report, and report cards.
- OB/GYN doctor workflow templates.
- Visual/doctor UX/account-session test updates for the locked pilot flow.
- `docs/OBGYN_UX_GUIDE.md`.

## General Gynecology Starter Scope

- Prisma migration `apps/api/prisma/migrations/20260629170000_general_gynecology_starter/migration.sql`.
- Dedicated `GynecologyVisit` model for recording-only structured gynecology visits.
- API routes for patient-scoped gynecology visits under `/patients/:id/gynecology-visits`.
- Patient-file Gynecology tab visible to authorized clinical users.
- General gynecology visit template with menstrual history, bleeding, pain, discharge, contraception history, examination, doctor impression, doctor plan, and follow-up date.
- Starter templates for abnormal uterine bleeding, pelvic pain, PCOS, fibroid or ovarian cyst, and contraception counseling.
- Patient timeline events for gynecology visit and each starter template.
- Browser print-friendly gynecology summary.
- Focused `scripts/general-gynecology-starter-test.mjs` and `npm run test:gyn:starter`.
- `docs/GENERAL_GYNECOLOGY_STARTER.md`.

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
- General gynecology templates do not diagnose, recommend treatment, recommend contraception methods, or prescribe.
- Antenatal and ultrasound UX records measurements/observations only; clinician interpretation remains required.
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
npm run test:visual:qa
npm run test:e2e:v01
npm run test:clinical:persistence
npm run test:gyn:starter
npm run test:obgyn:core
npm run test:accounts:rbac
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
