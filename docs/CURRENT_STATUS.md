# Current Status

Date: 2026-06-29

Branch: `pilot/mvp-obgyn-workflow-lock`

Base branch: `auth/accounts-session-rbac-hardening` at `87eb7e5`

Target tag: `v0.2-mvp-pilot-workflow-lock`

## Status Summary

Prij Clinic is locking the MVP pilot workflow on top of the accounts/session/RBAC hardening branch and the OB/GYN Specialty Engine v0.2 integration. This sprint is verification and workflow polish, not a new module sprint.

The intended pilot flow is now:

```text
Owner login -> patient file -> doctor workflow -> OB/GYN pregnancy workspace -> antenatal visit -> ultrasound report -> timeline -> print -> role-safe account behavior
```

This work combines:

- Codex A backend OB/GYN core depth.
- Codex B browser OB/GYN workspace, reporting UX, templates, and print-friendly summaries, now polished into a single patient-file workflow.
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

## Guideline Auto-Librarian Update

Branch: `leap/c-guideline-auto-librarian`

Added local Clinical Guideline Center foundation:

- Prisma guideline/evidence library models.
- Guideline permissions for Owner/Admin/Doctor workflows.
- Receptionist, Nurse, and Accountant blocked by default.
- Backend source/document/upload/import/search/ask/review/archive/job/update-check/query-log endpoints.
- Seeded source registry metadata only.
- Private local storage guard.
- Frontend `/guidelines/*` pages.
- Local automation scripts and `npm run test:guidelines`.

Still local/demo only. Do not use real patient data or real licensed guideline files in this repository.

## Guideline Secure Vault Hardening Update

Branch: `hardening/guideline-secure-vault`

Added private guideline file hardening:

- Authorized viewer endpoint: `GET /guidelines/documents/:id/view`.
- Owner-controlled download endpoint: `GET /guidelines/documents/:id/download`.
- Owner-only download setting endpoint: `PATCH /guidelines/documents/:id/file-access-settings`.
- Server-side access checks for every private file action.
- Receptionist and Accountant users blocked from guideline file view/download.
- Archived private guideline files restricted to owner file access.
- File access audit events for allowed and denied view/download attempts.
- Frontend private vault actions for secure viewer, download when allowed, access level, license status, and last access indicator.
- No raw local file paths returned to the frontend.
- AES-256-GCM local encryption for new uploads when `GUIDELINE_VAULT_ENCRYPTION_KEY` is configured.

Still local/demo only. Do not upload real paid or licensed guideline PDFs until encryption keys, backup/restore, malware scanning, retention, and license operations are reviewed.
