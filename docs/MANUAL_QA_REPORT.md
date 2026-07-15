# Manual QA Report

## v1.4.6 evidence

Focused tests passed for visit actions, baskets, Visit, search/queue, QR fallback, mobile Investigations, guideline ranges, History, prescriptions, hydration/errors, and credential safety. Type checks and production web/API builds passed. Queue concurrency correctly refused to run without isolated API/session/CSRF credentials.

Final legacy-suite status: patient workspace, patient queue, doctor dashboard, PHI/log redaction, prescriptions, investigation workflow, smart tags/search, Arabic/RTL, autosave, guideline viewer/summaries/search, pharmacology model/UI/search/governance, and isolated AI safety/regression passed. Live guideline center, security-expanded, accounts/RBAC, audit assertions, and public-login proxy did not pass because their configured runtime/login prerequisites were unavailable. The combined clinic-workflow script exited abnormally on Windows and is not claimed.

No real device, desktop browser, or ngrok walkthrough was performed. Those QA categories are **not performed**, not passed.

Date: 2026-07-14 (Africa/Cairo). Branch: `fix/v1.4.4-role-runtime-clinical-workflow-reconstruction`.

## Automated and runtime verification completed

- Production web builds compile all current routes, including dedicated prescription/investigation print, guideline viewer, and patient import.
- API production build and monorepo typecheck pass at recorded checkpoints.
- Production-like local UAT was started earlier in this sprint: web login and API health returned HTTP 200; API listener was verified loopback-only and then stopped.
- Focused v1.4.4 contracts passed for idempotency, runtime errors, Reception, Doctor, prescriptions, investigation workflow/print, Smart Clinical Search, external intake Arabic/HMAC, patient import, guidelines, and Arabic/RTL.
- Final commands passed: `prisma:repair`, `prisma:seed`, full monorepo typecheck, and full API/web/shared production build across 81 web routes.
- Clinical persistence passed 17/17; OB/GYN core passed 11/11; PHI/document safety passed 18 checks; AI safety passed; AI regression passed 10 checks with one fallback warning; external intake integration passed.
- Focused assertion totals: UUID 12, runtime error 17, Reception 22, Doctor 30, patient prescription 39, investigation print 16, patient import 25, guidelines 24, Arabic/RTL 23. Existing prescription builder/print, investigation workflow, Smart Tags, patient workspace, doctor visit, medication reference/import, and guideline library contracts passed.

## Unavailable or invalid legacy results

- `test:security:ci`: health and anonymous protection passed 4 checks; the remaining 20 checks could not authenticate because protected seeded credentials are unavailable. No password was changed or invented.
- `test:security:expanded`: 3 groups passed and 3 setup groups failed. Failures were inherited credential unavailability and collisions with existing active queue fixtures, not v1.4.4 assertions.
- `test:investigations:results` and `test:guidelines:library` could not authenticate with their legacy demo credential.
- `test:production-launch:pagination` was not runnable because its required isolated `DATABASE_URL` and `TEST_API_PORT` were not supplied.
- Legacy clinical persistence/OB-GYN scripts create labeled synthetic records and do not self-clean. No further stateful legacy suites were run against the preserved database, and no records were deleted.

## Not yet performed on this branch

- Authenticated browser walkthrough for Receptionist, Doctor, and Owner after all final changes.
- Visual measurement at 1366x768, 1440x900, 1920x1080, and 2560x1440.
- Android/iPhone portrait and landscape browser walkthrough.
- Current-branch ngrok tunnel QA.
- Physical/PDF print inspection for Arabic, English, bilingual, long-name, and controlled page-count cases.

These items must not be inferred from build or static contract tests. Prior v1.4.3 manual/ngrok evidence is historical only.
# v1.4.5 QA note — 2026-07-14

Automated viewport/contract tests cover 360–430 px mobile, tablet/desktop layouts, role routing, hydration, account sheet, queue handoff, QR capability states, patient workspace, guidelines, pharmacology, calculators, Dermatology, and RTL. Workspace typecheck/build and database checks are recorded in the release report. Physical iPhone/Android, role-authenticated browser walkthroughs, camera permission, and current ngrok HTTPS were not claimed unless explicitly recorded in the final report.

## v1.4.7 automated checkpoint verification — 2026-07-15

Targeted contracts passed for queue transaction, shared patient search, visit entry, shell/hydration, permanent QR, responsive investigations, guideline inventory/PDF range/search, prescription management, generic-first pharmacology/concept search/mobile atlas, and deterministic Care Assist safety/context. API and web typechecks passed at affected checkpoints. Forward migrations deployed without reset.

Final monorepo repair/seed/typecheck/build and consolidated suites are intentionally run once after documentation. Results belong in the sprint final report; no physical-device or credential-dependent result is inferred here.

Not performed: physical rear-camera scanning/cleanup, mobile Safari PDF rendering/ranges, portrait/landscape visual walkthrough, authenticated Receptionist/Doctor/Owner browser synchronization, real printing, current HTTPS tunnel, backup restore drill, penetration/privacy review, and clinical-governance approval.
