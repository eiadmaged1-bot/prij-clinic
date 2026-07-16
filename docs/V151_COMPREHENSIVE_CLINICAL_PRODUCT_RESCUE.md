# v1.5.1 comprehensive clinical product rescue

Date: 2026-07-16 (Africa/Cairo). Approved base: `13ab5e45f359e3f47b8fbeb7ff0e5e7c0e6c5e8d`. Branch: `fix/v1.5.1-comprehensive-clinical-product-rescue`.

## Data preservation

- Verified backup: `backups/prij-clinic-local-20260716-190503.backup.sql`, 28,540,862 bytes, SHA-256 `7B9583E8BDFCC546948F8861EC30C20AD16153F5467CE8A013F85C19C56EEAAD`; SQL header and completion marker verified.
- Prisma reported 77 migrations and no pending migrations. No migration was rewritten, no reset was used, and no protected clinical row was deleted.
- Patient, Encounter, QueueTicket, GuidelineDocument/version, ClinicalProtocol, ObUltrasound, InvestigationOrder/result, Prescription, ExternalPatientSubmission, Consent, and PatientDocument counts were unchanged.
- Activation repair dry run and apply found zero eligible rows because all 588 patients were already active and REAL. TEST and QUARANTINED patient counts remain zero. No Owner classification/import batch was applied.
- A live account-governance test created two unreferenced setup users. They were identified by the deterministic test-only login prefix, removed in one audited transaction, and the User count returned from 11 to the baseline 9. No clinical authorship or protected record was removed.

## Functional route result

The production route map is in `docs/V151_LIVE_ROUTE_AUDIT.md`. The live routes now use the repaired patient directory and Case Library, dedicated workspace editor, Knowledge Center and document viewer, investigation center, ultrasound center/editor, governed Drug Atlas and Dermatology workspace, intake center, Owner/Admin tables, Appearance, audit, security readiness, and staff messaging surfaces. Obsolete parallel components are not treated as completion evidence.

Read-only authenticated Playwright acceptance opened 19 repaired routes at 1440×900 and eight major responsive routes at 390×844. The test did not create patients, visits, queue tickets, orders, scans, or imports. A preserved 2,043,060-byte PDF returned `206` for `bytes=0-31`, `application/pdf`, and `%PDF-`; full delivery returned `200`; PDF.js rendered a 444×628 canvas. The renderer and worker are served from an allowlisted same-origin asset route backed by the installed official `pdfjs-dist` package.

## Medication and Dermatology governance

- Actual database: 392 active generic identities, 424 families, 427 family memberships, 6 unlinked active generics (1.53%).
- Identity/classification seed artifact: 340 RxNorm ingredients mapped through the public NLM RxClass ATC relationship, source version `2026_01_28`. WHO Collaborating Centre ATC/DDD Index 2026 is the classification authority.
- Clinical profiles remain source-incomplete: 35 legacy safety-profile rows; zero newly claimed mechanism, PD, PK, adverse-effect, contraindication, caution, interaction, monitoring, pregnancy/lactation, renal, hepatic, or antimicrobial-spectrum rows.
- Dermatology contains 13 source-linked topics, all `needs_clinical_review`, with no automatically approved medicine choices. Sources recorded by the seed are official NICE, American Academy of Dermatology, British Association of Dermatologists, ACOG, and Endocrine Society materials. Their concise prompts are not diagnoses or treatment selections.

## Validation

Passed: migration status/deploy, `prisma:repair`, `prisma:seed`, monorepo typecheck, API build, shared build, and the corrected web production build across 83 routes. All nine v1.5.1 focused suites passed, along with static RBAC, audit, PHI/document safety, log redaction, AI safety, Arabic/RTL, translation parity, proxy/login, patient workspace/autosave/queue, guideline range/search, pharmacology, investigation, ultrasound, import, and account-governance checks. API `/health/live`, `/health/ready`, and web-proxied readiness returned healthy connected responses.

The first production build attempt failed on six stale unused symbols left by route replacement; those symbols were removed and the rerun passed. Non-blocking Next lint warnings remain for several hook dependency arrays, one ultrasound `<img>`, and two existing CSS `end` compatibility warnings.

Database-writing RBAC/audit/demo workflows were not run after `test:db:isolation` correctly refused execution without `TEST_DATABASE_URL`. The older live RBAC script also expects absent `demo.*` accounts. These are unavailable, not passed. Physical-device, camera, actual printer, ngrok, real spreadsheet staging, and clinical-content approval were not performed.

## Protected counts: before → after

| Model | Before | After |
| --- | ---: | ---: |
| Patient | 588 | 588 |
| Encounter | 318 | 318 |
| QueueTicket | 182 | 182 |
| GuidelineDocument | 52 | 52 |
| GuidelineVersion | 14 | 14 |
| ClinicalProtocol | 442 | 442 |
| ObUltrasound | 213 | 213 |
| InvestigationOrder | 196 | 196 |
| InvestigationResult | 5 | 5 |
| Prescription | 195 | 195 |
| ExternalPatientSubmission | 4 | 4 |
| User | 9 | 9 |
| Role | 6 | 6 |
| ConsentRecord / template | 135 / 7 | 135 / 7 |
| PatientDocument | 1 | 1 |
| AuditLog | 39,669 | 39,844 |
| MedicationGeneric | 63 | 392 |
| DrugFamily | 53 | 424 |
