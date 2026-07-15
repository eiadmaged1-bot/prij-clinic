# v1.4.9 Core Recovery

## Starting point and branch

- Verified base: `a63db212bfc84c6f52f6a388368c4463c1de6842`
- Base branch: `fix/v1.4.8-owner-dashboard-and-late-qa-recovery`
- Sprint branch: `fix/v1.4.9-core-recovery-and-modular-workspace`

## Root causes and recovery

### Patient search and queue

Patient discovery inherited `branchScope(user)`, so a Receptionist could not find a permitted patient whose original registration branch differed from the working branch. Queue creation then preferred the patient's original branch and used reference scope intended for branch-bound operational records. The UI also collapsed failed picker requests into an empty result, while stale active-lock rows could mask the actual ticket state.

Search now checks `patient.read` and searches the authorized clinic directory; branch is an explicit optional filter. Queue check-in separately requires `user.branchId`, clinic-time bounds, one active patient/branch/date lock, and retained idempotency. Stale locks are repaired only when the linked ticket is not active or its scope is inconsistent. Typed safe errors and correlation IDs preserve the real actionable failure without exposing PHI or stack traces.

### Guidelines

The client treated every non-OK response as a generic unavailable condition, and affected screens could represent request failure like an empty library. The recovered request layer differentiates session expiry, access denial, network failure, API/database failure, and true empty inventory. Existing database/file records are neither re-imported nor replaced. Same-origin ranged delivery and browser fallback remain the authoritative file path.

### Case Library

The client filtered rows using name/MRN/tag regexes and used one empty/ready presentation for access, network, database, and zero-filter states. The server now relies on role/permission/branch policy and explicit `dataClassification`, while the client preserves access/API/network errors and distinguishes no cases from filters returning zero. My Cases remains doctor-owned; All Clinic Cases requires the existing elevated permission/Owner/Admin policy.

## Import default-decision contract

- Valid nonduplicate: `CONFIRM_CREATE`, `selected=true`.
- Exact normalized-phone match: `RESOLVE_EXISTING`, `selected=true`; commit blocked until `ATTACH_EXISTING`, `UPDATE_EXISTING`, or `CREATE_SEPARATE_WITH_REASON` is explicit.
- Hard validation failure: `BLOCKED`, `selected=false` and not committable.
- Manual-verification source row: remains selected for review but cannot auto-commit while unresolved.
- Missing decision never becomes Skip. Explicit reviewer opt-out persists across reload.

Google Sheets creates staging rows only, with HTTPS, constant-time server key comparison, rate/batch limits, idempotency, row hashes, audit, and no patient/phase/pregnancy/appointment/queue/encounter/prescription/investigation side effects. Operator dry-run prints counts only; stage sends rows to review.

## Record preservation snapshot

Before applying v1.4.9 migrations or seed, count-only reads reported: Patient 586, Encounter 315, QueueTicket 180, GuidelineDocument 52, ClinicalProtocol 442, ObUltrasound 213, ExternalPatientSubmission 4, InvestigationOrder 196, InvestigationResult 5, Prescription 195, MedicationGeneric 37. Classification columns were not yet migrated, so no legacy classification count was inferred.

After migration and seed, the same protected totals remained: Patient 586, Encounter 315, QueueTicket 180, GuidelineDocument 52, ClinicalProtocol 442, ObUltrasound 213, ExternalPatientSubmission 4, InvestigationOrder 196, InvestigationResult 5, and Prescription 195. MedicationGeneric increased from 37 to 63 through the governed catalog seed.

Classification totals are Patient 586 REAL, Encounter 315 REAL, QueueTicket 180 REAL, ObUltrasound 213 REAL, and ExternalPatientSubmission 4 REAL. No historical record was automatically declared TEST or QUARANTINED. The Owner candidate-review workflow must classify confirmed QA/test records before the operational exclusion policy can hide them. No patient, encounter, queue, guideline, ultrasound, submission, investigation, prescription, protocol, or audit record was intentionally deleted by migrations or seed.

## Medication content

The actual v1.4.9 import is 43 normalized generic identities/family memberships sourced to the official ATC/DDD Index 2026 from the WHO Collaborating Centre for Drug Statistics Methodology. This is classification coverage only. Every generic remains `needs_review`, every new membership `catalog_only`, and unsupported clinical sections remain empty. See `MEDICATION_CONTENT_GOVERNANCE.md`.

## Workspace panels

Implemented connected modules: identity/overview, active visit, history, allergies, medications, prescriptions, investigation requests/results, pregnancy/women's health, infertility, ultrasound, timeline, tasks/reminders, referrals, documents, consent, internal notes, permitted finance, and review hints. Allergy and medication modules read authoritative patient APIs. Presets, persistence precedence, error isolation, lazy loading metadata, dependency refresh, and missing-information rules are detailed in `MODULAR_PATIENT_WORKSPACE.md`.

## Final validation

- Prisma migration deploy, repair/client generation, seed, monorepo typecheck, and production API/web/shared build passed.
- The first production build compiled but failed its Next.js lint phase on four internal guideline anchors. Those anchors were changed to `next/link`; the required build was rerun and passed across 82 routes.
- All seven v1.4.9 focused suites passed (312 assertions total).
- Available RBAC, audit, PHI/log-redaction, Arabic/RTL, proxy/tunnel, patient workspace, Reception, autosave, guideline file/range/search, pharmacology, investigation/mobile/print, import, and account-governance contracts passed.
- Legacy copy/implementation locks remain failing: v1.3.5 requires the removed phrase `Use owner login`; v1.4.4 guideline navigation requires `Browse`; v1.4.5 guideline summaries require the raw label `Needs review`; and v1.4.5 queue handoff searches for the literal event name instead of the shared publisher.
- No integration suite was run against the clinic database. Manual/device/print/mobile Safari/ngrok/backup/clinical-review QA was not performed.
