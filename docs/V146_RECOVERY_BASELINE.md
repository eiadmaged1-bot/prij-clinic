# v1.4.6 Recovery Baseline and Root-Cause Findings

Date: 2026-07-14 (Africa/Cairo)

This report is a pre-edit, read-only recovery inventory. It does not claim production, clinical-content, device, tunnel, or credential-dependent QA readiness. No patient names, contact details, clinical narrative, secrets, or private document contents are included.

## Git baseline

- Branch: `fix/v1.4.6-mobile-core-recovery-and-workflow-unification`
- Exact base and HEAD before edits: `b5ecf2e59ddcb37c231ecf55003141a97c75f130`
- Base subject: `Reconstruct mobile clinical workflows and knowledge modules`
- Required v1.4.5 commit is contained in the branch and is the exact starting HEAD.
- `origin/fix/v1.4.6-mobile-core-recovery-and-workflow-unification` resolved to the same commit after `git fetch origin --tags --prune`.
- Ahead/behind after fetch: `0/0`.
- Worktree before edits: clean.
- `git diff --check` before edits: clean.
- Prisma migration status: 61 migrations found; configured local development database schema is up to date.

## De-identified data inventory

| Area | Live local count | Finding |
| --- | ---: | --- |
| Legacy medication ingredients | 1 | Exists and must be preserved. |
| Legacy medication products | 1 | Exists and must be preserved. |
| Legacy drug-market products | 9 | Exists and is not equivalent to the generic-first catalog. |
| Legacy drug-market variants | 15 | Exists; review gating and provenance remain applicable. |
| Generic medications | 37 | Queried by the current reference search. |
| Medication families | 53 | Mostly catalog-only placeholders. |
| Generic-family memberships | 2 | Only the seeded SABA identities are linked. |
| Medication aliases | 0 | Truly absent from the current local database. |
| Pharmacology sources | 0 | Truly absent; prevents source-backed profile creation. |
| Mechanism summaries | 0 | Truly absent. |
| Pharmacodynamic summaries | 0 | Truly absent. |
| Pharmacokinetic summaries | 0 | Truly absent. |
| Adverse effects / contraindications / cautions | 0 / 0 / 0 | Truly absent. |
| Interactions / monitoring | 0 / 0 | Truly absent. |
| Renal / hepatic guidance | 0 / 0 | Truly absent. |
| Pregnancy/lactation profiles | 0 | Truly absent in the new profile model. |
| Antimicrobial spectrum | 0 | Truly absent. |
| Prescription templates | 4 | Present, all sampled rows were explicitly demo-labelled and user-owned. |
| Doctor medication shortcuts / saved medications | 4 | Present, all sampled rows were explicitly demo-labelled and not catalog-linked. |
| Dedicated saved medication sets | 0 models | No dedicated set model exists; current “saved meds” are shortcuts. |
| Dermatology topics | 0 | Schema and search UI exist, but no live topics exist. |
| Dermatology generic options | 0 | Truly absent. |
| Guideline sources | 248 | Present. |
| Guideline documents | 51 | Present; sampled records were demo text, not the requested authoritative PDF. |
| Guideline versions | 14 | Present. |
| Guideline sections | 2,549 | Present and queried. |
| Guideline chunks/pages | 2,577 | Present and queried. |
| Guideline summaries / summary sections / citations | 0 / 0 / 0 | Structured-summary schema exists but live data is absent. |
| Queue tickets | 180 | Preserved. Recent de-identified states include waiting, called, completed, and cancelled. |
| Active same-patient/branch/date queue duplicate groups | 0 | Database lock strategy currently prevents active duplicates in sampled state. |
| Clinical tags | 15 | Present and separately persisted. |
| Previous operations | 2 | Present and separately persisted. |
| Medication-history items | 0 | No successful existing rows. |
| Previous-investigation items | 0 | No successful existing rows. |
| Investigation orders / items | 196 / 204 | Present; these are new requests, not historical results. |
| Operation catalog items | 55 | Present and queried. |
| Investigation favorite sets / items | 0 / 0 | Schema exists; live reusable sets are absent. |
| Follow-up tasks | 4 patient tasks total | No shared visit-action abstraction exists. |
| Audit logs | 38,721 | Audit infrastructure exists and is heavily used. |
| Encounter-linked Dermatology findings | 0 | Schema exists; live findings are absent. |

Representative reference records were inspected by catalog label and governance status only. Examples include reviewed generics such as Metformin and reviewed operation/investigation catalog records. Queue representatives were reduced to date, shortened opaque branch identifier, status, and count. No patient identity or clinical narrative was printed.

## What exists but is not connected

- Legacy medication ingredients/products and drug-market variants are separate from the generic-first `MedicationGeneric` graph. There is no recovery migration mapping the legacy rows to generic identities, families, aliases, or pharmacology profiles.
- The generic-first schema is extensive, but only the SABA family has generic memberships. Normal family presentation intentionally hides families without memberships, so most family rows exist but cannot produce usable generic results.
- The seed creates generic identity for Salbutamol and Terbutaline only. It does not populate source-backed pharmacology, pregnancy/lactation, antimicrobial, Dermatology, or guideline-summary content.
- Guideline sections/chunks exist, but the sampled documents have no authoritative stored PDF asset and no structured summaries. Static viewer controls therefore do not prove that a real PDF can render.
- Prescription templates and doctor shortcuts exist, but the sampled records are demo-only and shortcuts are not linked to medication catalog IDs.
- Historical medication, operation, and investigation records use three separate endpoints and tables. Plan investigations use `InvestigationOrder`; follow-up uses `PatientTask`; clinical tags use another independent service. There is no shared visit-action persistence or basket contract.

## Failure reproduction and root causes

### Add Metformin as medication history

Reproduced from the exact client request and validation path. The UI sends `currentOrPast: "past"`; the DTO accepts only `current`, `previous`, or `stopped`; the database default and service fallback use `past`. Global request validation rejects the UI payload before persistence. The client launches the promise with `void` and supplies no local error boundary, so the rejected save can surface as an unhandled runtime error. Root cause: frontend/backend/schema enum drift plus unsafe fire-and-forget error handling.

### Add a previous operation

The catalog lookup and dedicated persistence endpoint exist, and the service creates an audit record. The UI still uses the same fire-and-forget submit path with no pending/error state, no idempotency key, no preserved multi-item basket, and no duplicate protection. A permission, catalog, network, or validation failure becomes the same generic thrown error and may surface as a runtime rejection. Root cause: the shared client save path is unsafe even where the operation-specific service is valid.

### Add CBC/TSH investigation

Historical investigation persistence accepts catalog IDs, but plan persistence sends the catalog display `category` through a DTO that requires the Prisma `InvestigationCategory` enum. Live catalog categories include values such as `Laboratory - general`, `Hormonal/fertility`, and `Fertility tests`, which are not enum values such as `laboratory`. The standalone center has a separate mapper, while the patient Visit path sends the raw category. Root cause: two selected-state/persistence implementations and category enum drift.

### Search two patients with the same first name

The API returns up to 25 matching rows and does not explicitly auto-select the first result. It orders only by creation time, has no exact-match scoring, no cursor/load-more contract, and omits queue state and branch/phone-suffix disambiguation from the picker. The directory itself applies another client filter and truncation layer. Root cause: multiple search implementations with incomplete ranking, pagination, and disambiguation—not a one-row database query.

### Add patient to queue

The API has an active-ticket lock, idempotency, branch/date scoping, and currently has zero active duplicate groups. Client screens each load and derive queue state separately, and only some listen for `clinic-queue:changed`. QR considers only `waiting` and `called`, while the required authoritative state also includes in-room/completed/cancelled/failed transitions. Root cause: backend duplicate protection is stronger than frontend state unification; stale independent client snapshots can show contradictory states.

### Open guideline PDF tab

The viewer controls and secure view endpoint exist, but sampled live documents are demo text and have no authoritative PDF storage reference. Page count is inferred from extracted section bounds rather than authoritative PDF metadata. The file endpoint reads the complete file and does not implement HTTP range handling. Root cause: control-shell tests pass without a real registered PDF asset; authoritative asset registration, metadata, and range-capable delivery are incomplete.

### Search PCO/PCOS

Alias strings and ranking code exist, but structured summaries are empty and sampled guideline content is demo-oriented. Search can match indexed chunks/metadata, but there is no evidence that the requested approved source is present. Root cause: search code exists while authoritative source/summary data is absent; contract tests check source strings rather than result quality.

### Search Dermatology acne/hyperpigmentation

The API and UI exist and normal search intentionally exposes only approved generic options. Both live Dermatology tables contain zero rows. Root cause: additive schema and static UI were delivered without an idempotent, provenance-backed content import/seed. Returning zero is accurate for current data and must not be hidden with fake UI records.

### Use QR scanner through HTTPS

The current scanner checks secure context and rear camera, but immediately stops if native `BarcodeDetector` is missing. No JavaScript decoder fallback is present, so iPhone Safari and other browsers without native detection cannot scan even when camera access works. The QR page also memoizes session storage during render, which is unnecessary browser-state coupling. Real HTTPS/ngrok and physical-device QA has not yet been performed. Root cause: incomplete fallback chain; static capability tests do not exercise a real camera/browser.

### Investigation Center at 390 px

The two-column shell collapses below 980 px and basket rows collapse below 680 px, but the screen still renders a long category-button grid and both large operational panels. It does not implement the required mobile `Catalog | Sets | Follow-up | Manage` tabs. Root cause: responsive stacking exists, but mobile information architecture was not rebuilt.

### Hydration warning in a clean browser

The known `__gcrremoteframetoken__` attribute is not present in repository source and is consistent with external injection. No global hydration suppression exists. Static hydration contracts pass, but current code still has browser-derived state patterns that need production-browser verification. A clean Safari/private production-build reproduction has not yet been performed, so the injected attribute is not classified as an application defect. Root cause remains unproven until clean-browser production QA; suppressing warnings globally would be incorrect.

## Test-gap finding

All selected v1.4.5 static contract scripts passed, including pharmacology, Dermatology, queue handoff, guideline viewer/search, QR, hydration, patient workspace, autosave, and mobile header. Their passing status does not contradict the failures above: most inspect source strings/schema shape, and the only live-data pharmacology assertion covers SABA. Recovery work requires integration and browser assertions against real persisted state, not additional shell-only checks.

## Safe next implementation order

1. Repair shared historical/plan action contracts, validation, idempotency, auditing, and safe client errors.
2. Introduce one reusable selected-basket state/component and migrate the affected workflows incrementally.
3. Unify Visit/History/Plan rendering and autosave around the shared persistence layer.
4. Add forward-only recovery/import paths for source-backed reference content; never synthesize clinical claims to fill zero counts.
5. Repair search/queue/QR/PDF/mobile behavior and validate each with targeted integration/browser tests.

