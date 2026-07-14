# Manual QA Report

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
