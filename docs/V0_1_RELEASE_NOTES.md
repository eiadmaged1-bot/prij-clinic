# V0.1 Pilot Release Notes

Date: 2026-06-28

Prij Clinic V0.1 is a local/private pilot foundation for demo and engineering review. It is not production-ready, not a medical device, and must not be used with real patient data.

## OB/GYN v0.2 Workflow Verified After Accounts - 2026-06-29

This sprint verifies OB/GYN v0.2 after the accounts/session hardening tag `v0.2-accounts-session-rbac`.

- `/auth/me` remains the app identity source of truth.
- The patient Pregnancy workspace now records fake/demo pregnancy episodes, obstetric history, fetus records, antenatal visits, and OB ultrasound drafts through the existing backend APIs.
- OB/GYN timeline and print-friendly summaries were polished.
- The OB ultrasound builder keeps visible clinician-review safety wording and does not add FGR diagnosis, percentile calculation, fetal risk scoring, or automatic interpretation.
- Added `npm run test:obgyn:workflow` for the verified workflow path after stable accounts/session.
- Created `docs/OBGYN_V02_VERIFICATION_REPORT.md`.

## Staging Deployment Prep - 2026-06-29

This sprint prepares a safe staging deployment path with fake/demo data only:

- Added environment validation and placeholder-only local/staging/production env examples.
- Added production guards that reject demo seed flags and local demo passwords.
- Separated production minimal seed behavior from local/staging demo seed behavior.
- Added API/web Dockerfiles, `docker-compose.staging.yml`, production compose example, and nginx staging reverse-proxy example.
- Added database deployment workflow docs requiring `prisma migrate deploy` for staging/production.
- Verified the local backup script and documented staging backup, encryption, and restore-proof procedures.
- Added security hardening checklist, staging deployment runbook, operations monitoring plan, and release gate checklist.

Staging remains fake/demo data only. Production patient use remains blocked until legal, security, privacy, backup, monitoring, restore-proof, and clinical governance gates pass.

## MVP Release Candidate Verification - 2026-06-29

The MVP release candidate now integrates clinical persistence, OB/GYN core recording, patient-context workflow actions, patient timeline aggregation, release-candidate UX polish, visual QA, and production-readiness planning.

Verification additions:

- `docs/MVP_RC_VERIFICATION_CHECKLIST.md` for local demo pass/fail checks.
- `docs/PRODUCTION_READINESS_PLAN.md` for staging, pilot, and production gates.
- Final verification sequence covers typecheck, build, security CI, expanded security, theme UI, doctor UX, V0.1 E2E, clinical persistence, and visual QA.

The release-candidate UX polish includes:

- Larger, more readable controls and form fields.
- Tablet/mobile stacking for the app shell, top bar, patient header, patient tabs, guided visit steps, and admin views.
- Patient registry cards instead of a dense table-first experience.
- Current patient header wording changed to visible file context.
- Icon plus text treatment for primary doctor, patient, navigation, and display preference actions.
- Refined original 3D medical icon rendering and accessibility labeling.
- Normal dashboard wording avoids technical implementation details.
- `npm run test:visual:qa` lightweight visual QA sweep.
- New demo scripts for doctor, reception, owner, and mobile/tablet QA.

## Completed Pilot Workflow

V0.1 supports a demo-safe end-to-end clinic workflow:

Login -> dashboard -> patient registration -> consent foundation -> appointment -> queue/check-in -> encounter -> prescription -> investigation order -> pregnancy/OB ultrasound/report -> invoice/payment -> audit/security checks -> AI draft placeholder review.

The latest admin demo release also supports:

Login as local admin -> Admin Control Center -> users/roles overview -> service catalog and price editing -> safe reason-required overrides -> audit review.

The latest owner-portal UI sprint also supports:

Login as local admin -> Appearance -> choose Original Premium, Clinic Portal, Incision Portal, Minimal Clean, or Compact Operations -> open owner portal dashboard -> create/open patient file.

The doctor-friendly UX reset adds:

Login -> Doctor Mode -> open patient -> guided visit steps -> simplified patient file tabs -> large actions with 3D medical icons.

The clinical persistence branch adds:

Patient file -> patient-context appointment/check-in -> guided encounter draft persistence -> prescription/order/report/ultrasound draft -> invoice/payment -> consent -> patient timeline aggregation.

It also adds OB/GYN core recording depth for pregnancy episode dating fields, fetus records, and antenatal visit records. These are recording-only clinical data structures and do not provide automated diagnosis or fetal risk interpretation.

## Included Modules

- Auth, demo login, JWT bearer/cookie support.
- Server-side RBAC and route-level security tests.
- Branch-scoped demo records and referenced-record write scope checks where implemented.
- Audit logging and expanded audit assertions for representative sensitive reads, writes, status changes, sign/review actions, payments, consents, and AI draft review.
- Patients, appointments, queue, encounters, prescriptions, investigations, reports, pregnancies, OB ultrasound, billing, payments, dashboard.
- Admin Control Center with local demo admin login, service catalog/pricing, users/roles overview, safety settings, audit viewer, and reason-required override endpoints.
- Admin Appearance Settings with protected/audited theme changes.
- Clinic Portal theme with left sidebar, top patient search, owner dashboard cards, and patient-centered workspace tabs.
- Doctor Mode and Guided Visit pages for older-doctor-friendly daily use.
- Original 3D-style medical icon component used in navigation, patient tabs, doctor actions, and empty states.
- Comfort, Large, and Compact display preferences.
- Patient-context workflow APIs under `/patients/:id/...` for appointments, queue check-in, encounters, prescriptions, investigations, report placeholders, ultrasound drafts, invoices, payments, and consents.
- Aggregated patient timeline endpoint for the available MVP record types.
- OB/GYN core persistence for fetus records and antenatal visits linked to pregnancy episodes.
- Consent record foundation.
- Disabled draft-only AI placeholders.
- Local backup/restore helper scripts.
- CI and PostgreSQL-backed security integration workflow.
- V0.1 E2E demo workflow test.

## Safety Boundaries

- No real patient data.
- No real payment gateway.
- No real report uploads or PHI files.
- No external AI API calls.
- No diagnostic AI.
- No autonomous diagnosis, prescribing, signing, final-record update, RBAC bypass, consent bypass, or doctor-approval bypass.
- OB ultrasound records are manual data records only and do not diagnose FGR or any condition.
- Local admin credential `eyad` / `eyad` is for local demo only and must never be used outside a private local demo.
- Admin override actions require a reason and audit entry. Audit logs and signed clinical records cannot be silently hard-deleted from the normal UI/API.
- Clinic Portal is original Prij Clinic UI inspired by common clinic operating portal patterns. It does not copy competitor branding, assets, icons, or proprietary text.
- The 3D medical icons are original inline SVG/CSS UI elements created for this project; no proprietary medical icon pack was copied.

## Verification Commands

```powershell
npm run dev:stop
npm run prisma:repair
npm run prisma:seed
npm run typecheck
npm run build
npm run smoke:test
npm run test:security
npm run test:security:ci
npm run test:security:expanded
npm run test:admin:control
npm run test:theme:ui
npm run test:doctor:ux
npm run test:clinical:persistence
npm run test:e2e:v01
npm run test:visual:qa
```

## Remaining Limits

- Patient-to-doctor assignment is not modeled; doctor patient reads remain branch-scoped outside doctor-owned records.
- Lower-role positive-path coverage is representative and not exhaustive for every state transition.
- Consent enforcement is partial and not production legal workflow.
- File storage is documented but not implemented for real PHI files.
- Backup scripts are local helpers, not production backup infrastructure.
- Audit logs are application append-only but not tamper-resistant.
- Service catalog prices are editable from Admin, but invoice line items are not yet automatically generated from the catalog.
- Patient-context action forms are functional V0.1 workflow forms; they still need more production-grade usability testing and specialty workflow depth.
- MFA, monitoring, legal review, production deployment, and operational runbooks remain future work.
