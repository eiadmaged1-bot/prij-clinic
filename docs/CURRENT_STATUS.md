# Current Status

Date: 2026-06-29

Branch: `integration/v0.3-finance-gyn-guidelines`

Base branch: `integration/v0.3-finance-gyn` at `f4ce33a1c8a4dfd4807170979dd18f9510ba34bd`

Integrated source branches:

- `origin/leap/a-finance-reports-deepening` at `48ea318`
- `origin/leap/b-general-gynecology-starter` at `f057d85`
- `origin/hardening/guideline-secure-vault` at `7a0a46d606c978995062a92374d91b00b8bc0267`

Target tag: `v0.3.2-finance-gyn-guidelines-integrated`

## Status Summary

Prij Clinic now integrates the finance/report deepening sprint, the general gynecology starter sprint, and the secure local Guideline Center on top of the locked MVP pilot OB/GYN workflow.

The intended pilot flow is now:

```text
Owner login -> patient file -> Pregnancy/OB or General Gynecology -> Encounters -> Prescriptions -> Investigations -> Billing/Finance -> Evidence Library when authorized -> Timeline -> Print summaries -> role-safe account behavior
```

This remains local/demo software only. It is not production-ready, not a medical device, and must not be used with real patient data, real payment data, PHI uploads, external AI providers, or live clinical workflows.

## Integrated v0.3 Scope

- Patient file tabs now present Summary, Pregnancy/OB, General Gynecology, Encounters, Prescriptions, Investigations, Billing/Finance, Files, Timeline, and More.
- Finance and gynecology coexist in the patient file; neither tab hides the other for authorized users.
- Patient timeline includes available appointment, queue, encounter, prescription, investigation, report, gynecology, pregnancy, antenatal, ultrasound, invoice, payment, and consent events.
- Print-friendly browser summaries remain available for patient, antenatal, ultrasound, gynecology, billing statement, daily closing, and finance-report views.
- Role and permission checks remain server-side. UI hiding is not an authorization boundary.
- Guideline Center is available only to authorized Owner/Admin/Doctor-style evidence-library users; Receptionist and Accountant remain blocked from guideline medical content.

## Finance Status

- Service catalog placeholders are integrated.
- Catalog-linked and manual demo invoice lines are supported.
- Manual payment recording is supported.
- Partial/paid/unpaid invoice states are preserved.
- Refund, reversal, and invoice void patterns are reason-required and audited.
- Daily closing, patient financial statement, and owner finance reports are integrated.
- No real payment gateway, accounting ledger, insurance/TPA, tax engine, or e-invoicing is implemented.

## General Gynecology Status

- General Gynecology workspace is integrated into the patient file for authorized clinical users.
- Gynecology visit persistence is implemented through `GynecologyVisit`.
- Starter templates cover general visit, abnormal uterine bleeding, pelvic pain, PCOS, fibroid or ovarian cyst, and contraception counseling.
- Gynecology timeline events and browser print summary are integrated.
- Templates are recording-only. They do not diagnose, recommend treatment, recommend contraception methods, or prescribe.

## Safety State

- Seed data and automated tests use fake/demo-only records.
- No real AI API calls or provider SDK usage are implemented.
- AI draft artifacts are disabled/mock-only and cannot update final clinical records.
- OB ultrasound and pregnancy records do not calculate diagnoses, fetal risk, FGR, or fetal-image analysis.
- Clinician interpretation is required for ultrasound, Doppler notes, fetal biometry, pregnancy risk notes, gynecology impressions, and report impressions.
- Payment records are demo metadata only and do not use a real payment gateway.
- Report/file workflows remain metadata/placeholder only; no PHI upload is enabled.
- The protected `eyad` account is the only seeded local demo System Owner.
- Guideline private vault encryption is optional for local/demo uploads and requires a non-committed `GUIDELINE_VAULT_ENCRYPTION_KEY`; placeholders only are documented in env examples.

## Local Verification

The v0.3 integration was verified locally with fake/demo data using:

```powershell
git diff --check
npm run prisma:repair
npm run prisma:migrate:deploy
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
npm run test:finance:reports
npm run test:gyn:starter
npm run test:guidelines
npm run test:integrated:probes
npm run test:staging:smoke
```

`npm run test:staging:smoke` requires `APP_ENV=staging`; it was rerun in explicit staging-script mode against the local fake/demo app.

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

## Finance Gynecology Guideline Integration Update

Documented in `docs/V0_3_FINANCE_GYN_GUIDELINE_INTEGRATION.md`.

This branch preserves finance/report deepening, daily closing, service catalog, patient statement, general gynecology templates, Pregnancy/OB workflow, patient file tabs, secure Guideline Center, source registry, upload/import/reindex/update checks, secure viewer/download workflow, file access audit, optional AES-256-GCM guideline vault encryption, and role-denial coverage.
