# Production Launch Consolidation

Sprint: Production Launch Consolidation Mega Sprint

Starting branch verified by baseline command: `release/production-launch-consolidation`

Protected source checkpoint: `checkpoint-pre-production-launch-2026-07-11`

Starting visible commit: `105e0ab Finalize receptionist mobile simplification`

## Baseline Commands Recorded

```powershell
git status --short
git branch --show-current
git log --oneline -10
git diff --stat
node --version
npm --version
```

Observed baseline:

| Item | Value |
| --- | --- |
| Branch | `release/production-launch-consolidation` |
| Worktree | Clean at baseline command time |
| Latest commit | `105e0ab Finalize receptionist mobile simplification` |
| Node | `v24.18.0` |
| npm | `11.16.0` |

## Safety Position

The active database must not be destructively modified during this sprint. Inventory, backup validation, reset-plan generation, and verification can run. Reset apply must not run during this Codex session.

The web application must preserve the one-public-tunnel architecture: public browser traffic reaches the web app on port 3000, the API remains internal on port 3001, and browser API traffic goes through `/api/backend`.

Clinical AI remains assistive only. Any clinical output must remain draft-only until reviewed and approved by a doctor.

## Current Findings

- The Prisma schema already has broad clinical, finance, document, audit, queue, medication, guideline, and RBAC models.
- The existing seed has production demo-data refusal checks, but it still includes local protected account behavior and demo-data branches that need a later dedicated seed refactor.
- Browser authentication now uses the proxied HttpOnly cookie, removes legacy stored tokens, and enforces full server-side opaque session identifiers with explicit revocation hooks.
- Existing cleanup scripts are fragmented across v095, v121, v132, and API-local cleanup. The canonical production launch workflow now consolidates inventory, reset planning, backup manifest gates, apply refusal gates, and verification into one named workflow.

## Doctor Patient Fallback Checkpoint

Implemented and source-tested:

- Doctor has `patient.create`, `patient.read`, and existing search/encounter permissions without delete, merge, billing-adjust/void, user/role/branch, audit-export, or owner-management powers.
- Receptionist creation and check-in permissions remain unchanged; Nurse did not gain `patient.create`.
- `GET /patients/duplicate-candidates` is active-patient and branch scoped, returns limited identifiers/contact summaries, and audits the review.
- `POST /patients` accepts `Idempotency-Key` and `duplicateOverrideReason`; a high-confidence candidate produces `PATIENT_DUPLICATE_REVIEW_REQUIRED` until a reason is supplied, and accepted overrides are audited.
- Doctor desktop and mobile surfaces include Search, New Patient, Save Patient Only, Save & Start Visit, and Open Existing Patient.
- English and Arabic action registry labels exist for the new actions.

Deferred risks:

- Creation idempotency is a five-minute in-process safeguard. Persistent idempotency across API replicas or restarts needs a dedicated persistence design.
- Persistent Optimized and Minimalistic modes are implemented; authenticated manual cross-device verification remains a launch checklist item.
- Full server-side session revocation is now implemented, covering token invalidation, role boundary checks, and active-session disruption.

## Dual Interface and Patient Performance Checkpoint

- `UserPreference` persists interface, density, and mobile navigation enums per authenticated user. Optimized/Comfortable/Auto are safe defaults for existing users.
- The server is authoritative. Local storage caches only the three non-sensitive display enums to prevent visual flashing; authentication remains cookie-only.
- Interface mode has no effect on API roles or permissions.
- Doctor Minimalistic mobile navigation is exactly Today, Search, New Patient, Current Visit, and Account. Receptionist navigation contains no doctor visit action.
- The shared patient registry supplies stable keys, English/Arabic labels, permissions, visibility, lazy loaders, ordering, More grouping, icons, and action IDs.
- `GET /patients/:id/workspace-summary` is branch scoped, permission filtered, audited, and explicitly `no-store`.
- Initial patient open now requests the workspace summary and session context. Previously it requested the patient plus all configured related/global collections, timeline, phases, and infertility workspace (about 20+ calls depending on permissions).
- Pregnancy, infertility, documents, finance, timeline, reports, ultrasound, review hints, calculators, care review, and medication safety use registry or dynamic lazy boundaries.
- Patient and search requests abort when stale. Search uses a two-character minimum, 275 ms debounce, scoped defaults, and isolated section failures.
- No destructive database reset/apply or demo-data generation is part of this checkpoint.

Manual QA still required before launch:

- Desktop: Doctor Optimized, Receptionist Optimized, and Owner Optimized at 1440×900.
- Mobile/tablet: Doctor Minimalistic and supported Receptionist Minimalistic at 360×800, 390×844, 430×932, and 768×1024 in English LTR and Arabic RTL.
- Confirm sticky headers/footers, dialogs, print/share handoff, save/offline states, and cross-device preference persistence against a migrated non-production environment.

## Canonical Workflow

Dry-run inventory:

```powershell
npm run db:production-launch:inventory
```

Backup manifest preparation:

```powershell
npm run db:production-launch:backup
```

Dry-run reset plan:

```powershell
npm run db:production-launch:plan
```

Post-reset verification:

```powershell
npm run db:production-launch:verify
```

Apply command is generated by the plan output but must not be executed in this sprint.

## Part F — Patient Documents

- Supported bytes: JPEG (`.jpg`/`.jpeg`), PNG (`.png`), WebP (`.webp`), and PDF (`.pdf`). Declared MIME, extension, and magic bytes must agree; empty, truncated, executable/archive masquerades, and suspicious double extensions are rejected.
- Limits: standard/unknown requests 2 MB at the web proxy, images 10 MB at API validation, and PDFs/documents 25 MB. Content is counted while reading; `Content-Length` is not trusted alone.
- Images are auto-oriented and re-encoded with Sharp, removing EXIF/GPS/device/XMP/IPTC metadata. PDF clinical content is not rewritten; reliable PDF metadata removal is a documented remaining limitation.
- Files receive opaque UUID storage keys, are AES-256-GCM encrypted with a per-file nonce, written to quarantine, and promoted only after validation and scan policy. Raw keys are configuration-only; the database stores key identifiers and envelope versions.
- The scanner boundary currently reports `NOT_CONFIGURED`. Production requires encryption and fails closed unless a real scanner returns `CLEAN`; no scan is represented as having occurred.
- Downloads require an authenticated, branch-scoped patient/document permission check. Receptionists are restricted to consent and insurance-administration categories. Quarantined, archived, voided, missing, or integrity-failed files are not served. Responses use `nosniff` and `private, no-store` without filesystem paths.
- `npm run documents:storage:reconcile` is count-only dry-run by default. `--apply` moves suspicious files into orphan quarantine rather than deleting them.
- Migration `20260712043000_patient_document_security` is forward-only and was not applied to the active clinic database.


## Part G � Application Security, Observability, Operational Readiness and QA Foundation

- Verified the full migration chain applies cleanly to a fresh database (scripts/production-launch-migration-chain-test.mjs).
- Implemented global CSRF protection using double-submit cookies on all mutating requests.
- Enforced strict HTTP security headers via Next.js configuration (CSP, X-Frame-Options, X-Content-Type-Options, etc.).
- Configured request rate limiting via @nestjs/throttler globally, with tighter limits on authentication routes.
- Added a LoggerInterceptor to redact sensitive fields (passwords, PHI) from logs.
- Added Kubernetes-style /health/live and /health/ready endpoints.
- Added slow query logging directly to Prisma Client.
- Created /owner/diagnostics to provide administrators with live API status and recent audit logs.
- Placeholder backup and restore verification scripts added.
- Playwright E2E smoke suite configured and baseline tests implemented.
