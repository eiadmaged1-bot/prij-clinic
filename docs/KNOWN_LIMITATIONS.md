# Known Limitations

- v0.10.1 adds an official medication import operator, but it does not recover the old missing medication artifact.
- Official medication rows remain 0 until authorized official files are placed in `storage/official-medication-sources/` and explicitly applied.
- The operator can scan, dry-run, and guard apply imports; it does not create medication rows from memory, synthetic fixtures, or generated lists.
- Prescription medication selection remains blocked while there are no verified or needs_review official rows.
- Market strength/form/pack fields are not patient dosing instructions, and the operator does not generate dose, frequency, duration, route, or directions.
- Do not use stock/order/checkout sources, real patient data, external AI, or production-like environments for apply imports.

- v0.10.0 prepares safe official medication re-import, but no Bahrain NHRA or Oman MOH official source file is currently acquired in local ignored storage.
- v0.10.0 parser support is limited to reviewed CSV, XLSX/XLS, JSON, and JSONL source files. PDF/ZIP acquisition is allowed for safe storage, but parsing requires reviewed extraction or source-specific parser work before import.
- Official medication rows and verified medication rows remain 0 until an official/public or owner-approved source file is acquired and imported.
- Prescription medication selection must not be called strict-ready while official rows remain 0.

- v0.9.9 recovered provenance from project history and local infrastructure metadata, but did not find a recoverable old official export or running DB with official medication rows. The blocker remains the unavailable ignored export/old DB artifact.
- v0.9.9 Docker volume handling is metadata-only by default. Existing Postgres volumes were not attached to a new server because doing so can mutate recovery state.
- v0.9.9 does not create fake medication rows, mark unverified rows verified, scrape retail/checkout/stock/order pages, or add patient dosing instructions.

- v0.9.7 does not create or verify real medication data by itself. It restores prior approved official exports when present, otherwise reports a missing-source warning.
- v0.9.7 prescription readiness only attaches medication reference metadata to draft prescription items. It does not generate dose, frequency, duration, route, or patient instructions.
- Guideline/protocol readiness verifies metadata and seeded/demo content only. Full guideline document ingestion still requires owner-provided/open files and governance review.

- v0.9.6 finalized the local/demo DB state for QA, but it is still not production data retention, legal deletion, clinical governance, or privacy certification.
- v0.9.6 cleanup was applied only to clearly demo/test/local patient-linked operational records. It did not prove behavior for real patient records and must not be reused as a blind wipe.
- API-backed account creation checks require the local API to be running. In this session, source/UI support was verified, but endpoint creation/login/denial proof remains a manual or full-stack check.
- Official medication rows are absent in this local DB even though medication reference/market tables are preserved. The next step is restore/import from approved sources; do not fake official medication rows.
- The v0.9.6 report artifacts are generated under ignored `storage/local-db-finalization/` and are not committed.
- v0.9.6 does not create a release tag and does not replace manual browser QA.

- v0.9.5 is not a production data-retention or legal deletion policy.
- v0.9.5 cleanup only targets clearly demo/test/local operational rows and must not be used to clean real patient records.
- v0.9.5 apply cleanup is guarded by environment checks, but operators must still review dry-run output first.
- Local endpoint account verification requires the API, PostgreSQL, migrations, and seeded demo data. If the API is unavailable, the verifier performs DB/source fallback checks and reports a warning instead of proving endpoint login behavior.
- Investigation catalog rows are reference/order names only. They do not provide diagnostic interpretation or clinical recommendations.
- Medication market strength/form/pack fields remain market metadata only and must not be used as patient dosing instructions.
- v0.9.5 does not add external AI, a payment gateway, retail scraping, stock/order/checkout behavior, or production credential handling.
- v0.9.5 does not create a release tag and does not finalize v0.9.3, v0.9.4, or v0.9.5.

- v0.9.4 Playwright browser journeys require the web app, API, PostgreSQL, migrations, and seeded demo data. They are expected to run fully in GitHub Actions with a PostgreSQL service when local Docker is unavailable.
- v0.9.4 browser QA accelerates manual review but does not replace final manual browser QA by the owner.
- v0.9.4 does not release v0.9.3 or create any release tag.

- CI Release Gate passed and normal CI passed, but final local machine validation is still pending.
- Manual browser QA is still pending.
- v0.9.3 is a release candidate, not a final release.
- The application is not production-ready.
- Do not use real patient data.
- No production security, privacy, legal, medical-device, or clinical-governance signoff has been completed.
- v0.9.3 API-backed automated checks require Docker Desktop/PostgreSQL, a repaired Prisma client, seeded demo data, and the local API to be reachable.
- The `v0.9.3 Release Gate` GitHub Actions workflow provides CI PostgreSQL coverage for the remote session blocker, but it is still not a release by itself and does not replace final local/manual browser QA.
- The CI release gate must not use `V093_ALLOW_ENV_SKIP=1`; if API/DB-backed checks cannot run in CI, the workflow must fail.
- In this session, Docker Desktop/PostgreSQL was not reachable, so `test:v093:patient-create`, `test:v093:roles`, and the full DB/API-backed test sweep remain blocked rather than passed. v0.9.3 is not released yet.
- `V093_ALLOW_ENV_SKIP=1` is only a local blocked-machine escape hatch for API-backed v0.9.3 checks. It is not release-validating and must not be used before creating a release tag.
- The release tag `v0.9.3-automated-qa-stabilization` must not be created until `npm run test:v093:patient-create` and `npm run test:v093:roles` pass without environment skip.
- `npm run dev:diagnose` reports local environment readiness but does not fix Docker Desktop/PostgreSQL availability.
- v0.9.3 route and medication runtime page checks require the Next web server to be running; source-only parts still run without a browser.
- Oman MOH batch 4 leaves 4,500 Oman rows review-gated, including 71 currently low-confidence/blocked rows.
- Bahrain NHRA batch 4 leaves 2,569 Bahrain rows review-gated.
- Qatar, Kuwait, and Saudi source recovery remains diagnostic-only unless official files/endpoints are safely accessible.
- Egypt bulk import requires owner-provided official files; targeted lookup is one explicit query at a time.
- Product profiles show audit-backed verification status, but no dedicated `verifiedBy`/`verifiedAt` columns exist yet.
- Raw official fields are intentionally not shown in normal UI.
- Restore drill reports and exports are local ignored artifacts and are not committed.
- Local visual/account UI tests can fail with `fetch failed` when the expected local server state is unavailable.
- v0.9 visible orders are a skeleton over existing investigation orders; no external lab/radiology integration exists.
- Consent/legal templates remain demo placeholders until clinic-approved legal content and signature workflow are added.
- Patient creation duplicate detection is documented as future work.
- Finance remains manual. There is no real payment gateway, card handling, tax engine, or full ledger.
- Medication reference pages show existing v0.8.6 official data status only; this sprint adds no new medication importer.
- Prij Heritage uses CSS font stacks only; no font files are bundled.
- Theme selection still uses the existing lightweight appearance/frontend theme system. No new backend theme engine was added.
- Medication source metadata remains available to backend/admin workflows, but normal UI intentionally avoids technical source and price fields.
