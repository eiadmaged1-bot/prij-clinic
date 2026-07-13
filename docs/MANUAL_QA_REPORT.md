# Manual QA Report

Status: final automated, desktop, and public QA is in progress. This document records only executed evidence; unchecked items are not represented as passing.

## Automated source and type checks completed

- Role shell/session/guideline focused checks: passed.
- Patient directory, patient workspace, smart tags, doctor visit, investigation ordering, prescription builder/print, medication reference/import, and external-intake focused checks: passed.
- Root workspace typecheck after the role-operations reconstruction: passed.
- Role operations contract: passed.
- Legacy receptionist contract updated to the reconstructed shell/queue contract: 89 checks passed.
- Visual density contract: passed.

One legacy clinical-request runtime check previously failed because it expected a removed hard-coded demo login. A medication-selection runtime check previously could not reach an API that was not running. Neither result is recorded as a product pass; both require the final running-stack matrix.

## Desktop QA

Pending final running-stack verification for Doctor, Receptionist, and Owner at:

- 1366×768
- 1440×900
- 1920×1080
- 2560×1440

Required checks: symmetry, equal card sizes, wrapping/overflow, role-specific data, direct-route restrictions, history tags/search, visit flow, investigation favorites, templates, medication selection, and A5 preview.

## Public QA

Pending validation of the current single tunnel at `https://regretful-unwomanly-silliness.ngrok-free.dev`. Only web port 3000 may be tunneled. All API checks must use `/api/backend/...`, and webhook checks must use signed synthetic dry-run data only.

No production or real-patient-data approval is implied by this QA report.
