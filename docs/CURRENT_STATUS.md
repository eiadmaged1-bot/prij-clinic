# Current Status

## v1.4.9 clinic core recovery — 2026-07-15

Branch `fix/v1.4.9-core-recovery-and-modular-workspace`, verified base `a63db212bfc84c6f52f6a388368c4463c1de6842`.

- Patient search is clinic-wide for authorized roles, optionally branch-filtered, ranked and paginated; queue operations remain current-working-branch/current-clinic-date scoped.
- Reception check-in uses typed safe failures, retained idempotency, stale-lock repair, and shared Reception/Doctor/Owner refresh events.
- Operational data classification, Owner review, quarantine, exact-phone duplicate review, and hard test-database isolation are implemented without auto-deleting or name-only classification.
- Guideline and Case Library clients preserve error states instead of converting failures to empty/ready views.
- Excel/CSV and Google Sheets stage rows only. Eligible import rows default to `CONFIRM_CREATE` and selected; exact-phone matches require an explicit resolution; blocked rows cannot commit.
- Ultrasound inventory is paginated and context-aware; meaningful content is required before review. Protocol completion stores structured unanswered sections without generating medical answers.
- The Drug Atlas seed links 43 identity/classification records to an official ATC/DDD 2026 source. Clinical monograph sections remain visibly incomplete and unapproved.
- The modular patient workspace has persisted clinic/role/specialty/personal/patient layouts, eight presets, accessible mobile ordering, panel isolation, authoritative allergy/medication reads, and deterministic non-diagnostic missing-information rules.
- Seven appearance presets resolve device/account/role/clinic scopes independently from patient layouts. Account security adds forced password change, revoke/lock/unlock, two-step 2FA reset state, Owner self-password change, final-Owner protection, and redacted audit history.

Forward-only migrations added: `20260715201500_v149_data_classification`, `20260715213000_v149_patient_import_fields`, `20260715222000_v149_ultrasound_context`, `20260715223500_v149_protocol_completion`, `20260715231500_v149_patient_workspace_layouts`, and `20260716000500_v149_appearance_account_security`. No historical migration was rewritten and no database reset or automatic record deletion was performed.

Count-only pre-migration preservation snapshot: 586 patients, 315 encounters, 180 queue tickets, 52 guideline documents, 442 protocols, 213 ultrasounds, 4 external submissions, 196 investigation orders, 5 investigation results, 195 prescriptions, and 37 medication generics. Final post-migration/seed counts are recorded in `docs/V149_CORE_RECOVERY.md`.

## v1.4.6 recovery status

Base `b5ecf2e59ddcb37c231ecf55003141a97c75f130`. Repaired audited visit actions, baskets, five-step Visit, collapsed History, search/queue, QR fallback, mobile Investigations, prescriptions, guideline ranges, and hydration/errors. Additive migration `20260714233000_prescription_structured_fields` is applied locally; no clinical/audit records were deleted.

Inventory: generics 37; families 53; memberships 2 (SABA → Salbutamol/Terbutaline); templates/shortcuts 4/4; guideline sources/documents/versions/sections/chunks 248/51/14/2549/2577; queue 180 with zero active duplicate groups; operation history 2; investigation orders/items 196/204; tags 15; audit 38,721. Pharmacology evidence, aliases, summaries, and Dermatology records remain zero.

Date: 2026-07-14 (Africa/Cairo). Branch: `fix/v1.4.4-role-runtime-clinical-workflow-reconstruction`.

## Verified v1.4.4 work

- Central secure idempotency UUID generation now supports native `randomUUID`, secure `getRandomValues` fallback via `uuid`, SSR import, stable attempts, retry, refresh, and double-submit behavior.
- Production-safe localized error classification and loopback-only API / same-origin web UAT scripts are present.
- Reception desktop/mobile navigation and operational actions were repaired; Doctor dashboard now uses real scoped operational counts and active-visit actions.
- Real prescriptions and investigation requests require patient plus active encounter context. Standalone pages are template/library/follow-up centers.
- Dedicated patient-linked A5 prescription and A4 investigation request print routes are present.
- Investigation sets support bilingual personal metadata and permission-gated branch/clinic scopes. The catalog remains extensible rather than claimed comprehensive.
- Smart Clinical Search stores assignment provenance, source encounter, confirmation, status/effective/resolution dates, and exposes AND/OR/NOT matching evidence. Derived tags are not searchable until confirmed.
- External intake preserves signed UTF-8 raw bytes, isolates dry runs, proves Arabic round-trip, and uses patient search/candidate comparison without automatic merging.
- Owner/Admin patient CSV/XLSX import uses in-memory hashing, mapping, encoding selection, mandatory preview, row validation, duplicate blocking, selected commits, and batch/row audit records.
- Guideline cards open a stable-ID section viewer. PDF/TXT/Markdown upload, secure storage, indexing, review, RBAC, and audit are connected.
- Arabic now sets the global document to `lang=ar` and `dir=rtl`; core navigation/session translations and Arabic-aware clinical search/import validation are verified.

Forward-only migrations added in this sprint: prescription dispensing metadata, investigation set scopes, clinical-tag provenance/confirmation, and patient import batches. No historical migration was rewritten and the database was not reset.

This is development verification, not production, privacy, deployment, or clinical-governance signoff.

Final verification results and unavailable legacy suites are recorded in `docs/MANUAL_QA_REPORT.md`.
# v1.4.5 reconstruction (2026-07-14)

Implemented on `fix/v1.4.5-mobile-workflow-knowledge-reconstruction`: role-safe landings, shared sticky mobile header/account sheet, compact Reception and Doctor workspaces, idempotent patient-to-queue handoff, deterministic hydration, permanent PHI-free QR workflow, guided patient workspace, reversible/amendable clinical tags, resilient autosave/session handling, authoritative PDF guideline viewer, reviewed page-cited summaries/search, generic-first pharmacology, approved formula calculators, Dermatology reference search, and audited encounter-linked findings. Clinical knowledge output remains assistive and doctor-review gated.

## v1.4.7 connected clinic core — 2026-07-15

Branch `fix/v1.4.7-connected-clinic-core-and-drug-atlas`, base `9e50efda633bba22d0a689239682d2afd115eca6`.

- Patient creation and queue insertion now use the persisted patient ID, canonical active queue states, idempotent retry, partial-success recovery, branch/clinic-date scoping, and shared Reception/Doctor status refresh.
- All targeted patient selectors use shared explicit-selection results; archived patients are blocked from Check-in until restored.
- Reception Home, visit entry, mobile shell, permanent QR, Investigation Center, and Prescription Center follow the patient/active-visit workflow.
- Guideline inventory is uncapped for authorized reads; active, recent, review and all-record views are separate. Duplicate hashes are rejected and audited. Antibiotics metadata was corrected without changing approval state.
- The browse-first Clinical Drug Atlas preserves 37 active generics and 53 families. Exact existing-data matching links 27 generics; 10 remain unlinked. SABA still maps to Salbutamol and Terbutaline.
- Four deterministic context rules connect structured facts to review links and missing-information prompts. They do not diagnose, order, prescribe, or change medication. Doctor decisions are audited and appear in the patient timeline.

Forward-only migrations added: queue `IN_ROOM` and birth year; antibiotics metadata correction; deterministic generic-family joins; four context rule definitions; context-rule safety wording correction. No reset, migration rewrite, or record deletion was performed.

## v1.4.8 owner dashboard and late QA recovery — 2026-07-15

Branch `fix/v1.4.8-owner-dashboard-and-late-qa-recovery`, base `c5967824d0d53ffc1767cdf43ba68309a9d8b51a`.

- Reception now defaults to active patients, uses persistent explicit shared selection, supports browse-all pagination/filters, and retains the authoritative idempotent patient-to-queue transaction.
- Owner Control Center uses one Owner-authorized aggregation endpoint with bounded database counts, partial metric failure isolation, recorded-payment revenue, readiness checks, real task categories, five service rows, and five redacted audit rows.
- The shared shell has one compact role-aware header/drawer/account sheet with scroll lock, Escape/outside/swipe close, safe areas, RTL direction, and language persistence.
- External intake and spreadsheet import use exact normalized Egyptian phone duplicate detection. Guideline inventory is paginated and exact file hashes are rejected. New PDF imports retain parsed page counts.
- Clinical Drug Atlas browse rooms, all-family/all-generic views, unlinked content, recent review, favorites, and content-being-completed views use the preserved canonical records without fabricating evidence.
- Investigation baskets persist per patient encounter and prevent duplicate catalog items. Standalone Encounters and Ultrasound are history/index entry points into the patient Visit and Pregnancy workspaces.
- Account administration now prevents demotion or deactivation of the final active Owner and retains session revocation/audit behavior.

One forward-only migration was added: `20260715190000_guideline_authoritative_page_count`. No migration was rewritten and no database reset or record deletion was performed.

Post-seed preserved inventory: 586 patient records (37 active), 180 queue tickets (4 currently active), 37 generic medicines, 53 drug families, 27 deterministic generic-family memberships, 4 prescription templates, 4 medication shortcuts, 249 guideline sources, 52 guideline documents, 14 guideline versions, 2,578 guideline sections, 135 investigation catalog items, and 38,939 audit records.
