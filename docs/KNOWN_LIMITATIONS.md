# Known Limitations

- v0.12.1 creates a local/dev clean-baseline process, not a production deletion, retention, legal, privacy, or clinical-governance policy.
- Apply cleanup is for local/dev/development/test/CI only and must not be run against staging or production.
- Full local baseline mode deletes all local operational patient rows; operators must review dry-run output before apply.
- Service catalog seed rows are unpriced and review-required. Billing rejects unpriced catalog services until finance review adds real prices.
- Medication reference readiness remains warning-only when official rows are zero. The project must restore/import approved official rows instead of generating medication data.
- Operation and investigation catalogs are reference names only. They do not provide diagnosis, indication, treatment recommendation, or automated clinical advice.

- v0.12.0 upgrades the real Next.js clinic workspace UI, but it is not production security, privacy, medical-device, or clinical-governance certification.
- The new v0.12 workspace Playwright spec needs the real app, API, database, migrations, and owner login to be reachable.
- Physical phone QA remains required for Tailscale browser behavior, firewall routing, touch drawer ergonomics, and real mobile viewport behavior.
- Queue, calendar, orders, prescriptions, and investigations remain bounded by the existing backend workflow support; no external integrations were added.
- Medication reference data must come from official or owner-approved imports. No fake rows, automatic dosing, AI prescribing, stock, cart, checkout, or buy workflow is added.
- Real patient data and production PHI uploads remain forbidden.

- v0.11.6 fixes the automated real app heading y-position regression for `/dashboard` and `/prescriptions`, but it is not production mobile, privacy, security, medical-device, or clinical-governance certification.
- Physical phone QA is still required for real Tailscale browser behavior, local firewall routing, and touch drawer ergonomics.
- The shell topbar is intentionally compact below `1200px`; secondary utility controls should be exposed through future deliberate navigation/settings work instead of being stacked above clinical page headings.
- Tailscale LAN access remains exact-origin local development behavior only. Wildcards, broad `100.64.0.0/10` CORS, public CIDRs, and HTTP LAN origins in staging/production remain unsupported.

- v0.11.5 stabilizes the real app shell and exact Tailscale local profile, but it is not a production mobile, privacy, security, medical-device, or clinical-governance certification.
- Tailscale phone login still depends on the dev servers running, exact `100.127.4.46` profile variables, Tailscale routing, and local firewall allowance.
- Broad `100.64.0.0/10` CORS, wildcard origins, public CIDRs, and HTTP LAN origins in staging/production remain intentionally unsupported.
- Manual phone QA is still required because automated tests cannot validate the physical phone browser and network path from this session.

- v0.11.3 is a static HTML mobile polish sprint only. It does not certify production mobile support, privacy compliance, clinical governance, authentication, backend behavior, or security posture.
- Patient File tab clipping was fixed in the generated static lab, but physical phone QA still depends on `npm run design:serve-html`, same-Wi-Fi routing, and local firewall allowance.
- The mobile header and Patient File polish do not add backend preferences, API calls, real auth, real patient data, medication dosing, AI diagnosis, AI prescribing, commerce behavior, schema changes, CORS changes, image metadata changes, or a release tag.
- Theme switching remains local static preview behavior through `localStorage`; it is not a database-backed user preference system.

- v0.11.2 integrates secure backend/schema hardening with the static visual lab only. It is not a production security, privacy, medical-device, clinical-governance, or release signoff.
- No backend changes are introduced by the UI import; static HTML remains a local visual lab with no API dependency.
- Phone LAN QA still requires `npm run design:serve-html`, a physical phone on the same Wi-Fi, reachable LAN routing, and local firewall allowance.
- Staging smoke requires `APP_ENV=staging` plus explicit staging environment variables and should not be run from an unconfigured local/demo environment.

- v0.10.9 confirms local schema integrity remediation for the configured DB only; it is not a production data-retention, privacy, or clinical-governance signoff.
- The v0.10.9 duplicate remediation script is local/dev/test guarded and should not be run against staging or production.
- The configured local DB already had the expected legacy duplicate resolved before this run, so the apply script was not rerun in this session.
- `_prisma_migrations` contains a successful schema-hardening row and an older unfinished local row for the same migration name; deploy reports no pending migrations, but this local history should be reviewed before treating it as a production migration pattern.
- Existing warnings remain: AI routes are mock/draft-only, broad authenticated routes may not have denied-role assertions, and doctor patient reads are branch-scoped because patient-to-doctor assignment is not modeled.

- v0.10.5 hardens LAN development profiles but does not certify production hosting, privacy compliance, medical-device behavior, or clinical governance.
- LAN testing still depends on same-Wi-Fi routing, local firewall rules, and correctly configured explicit origins.
- `.local` profiles require working mDNS/Bonjour resolution on each device.
- Private CIDR CORS matching is local/dev/test only and must not be used in staging or production.
- Staging and production require exact HTTPS origins and fail closed when they are missing.

- v0.11.1 moves the static theme selector into Appearance only. It does not add backend preference storage, real authentication, production security certification, clinical governance, or database-backed user settings.
- Appearance changes the static visual preview only and has no API calls, schema changes, patient data, medication dosing, AI diagnosis, AI prescribing, commerce behavior, or release tag.
- Manual phone QA still depends on `npm run design:serve-html`, same-Wi-Fi routing, and local firewall rules.
- Theme Gallery remains a visual preview area; theme application is handled from Appearance.

- v0.11.0 imports a visual design system into the static HTML lab only. It does not certify production mobile support, privacy compliance, clinical governance, authentication, backend behavior, or security posture.
- The ZIP `incoming/visual-upgrade/prij-clinic-visual-upgrade-v0_11.zip` is a design reference only and must not be committed.
- v0.11.0 does not add real patient data, medication data, API calls, real authentication, AI diagnosis, AI prescribing, medication dosing instructions, stock/order/cart/checkout behavior, payment behavior, schema changes, backend code changes, or a release tag.
- Phone testing still depends on `npm run design:serve-html`, same-Wi-Fi routing, and local firewall rules.
- Generated package zips, screenshots, Playwright reports, test results, storage, uploads, logs, backups, DB files, and environment files remain local artifacts and must not be committed.

- v0.10.4 is a static HTML design lab only. It does not certify production mobile support, privacy compliance, clinical governance, authentication, or backend behavior.
- `ui-export/index.html` can be opened directly, but phone testing should use `npm run design:serve-html` because `file://` paths and phone browsers differ from a served static site.
- LAN phone testing depends on same-Wi-Fi routing and local firewall rules.
- The lab includes placeholder UI only: no real patient data, medication rows, passwords, secrets, uploads, API calls, database access, or external AI.
- The Drug Market section is non-commerce reference UI only.
- The Prescriptions section intentionally omits preset patient medication directions.
- Generated package zips live under ignored `storage/ui-export/` and must not be committed.

- v0.10.2 improves mobile browser usability but does not certify production mobile support, medical-device behavior, privacy compliance, or clinical governance.
- LAN phone browsing depends on same-Wi-Fi routing, local firewall rules, and local dev servers on ports 3000 and 3001.
- Mobile Playwright checks require the local web app, API, PostgreSQL, migrations, and demo credentials to be reachable.
- Manual iPhone Safari and Android Chrome QA remains required after automated checks.
- v0.10.2 does not add medication data, fake official rows, external AI, a payment gateway, or release tags.

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
# Image/File Storage Limitations

- HEIC/HEIF uploads are rejected until runtime support and governance are approved.
- Patient document upload integration tests require a running local API and database.
- PDFs and non-image files are not production-ready PHI storage.
- No malware scanning or external production object storage provider is configured yet.
# Known Limitations

v0.12.2 limitations:
- Medication generic seed is intentionally limited and not a complete formulary.
- Controlled generic medication rows are not seeded by default.
- Medication lookup does not provide dosing, frequency, duration, instructions, treatment choice, or safety advice.
- Investigation catalog is request/history metadata only and does not interpret results.
- Operation catalog is history documentation only and does not imply procedure planning.
- Patient history sheet UI saves structured fields but does not diagnose or automate clinical decisions.
- v0.12.3 is expected to add Care Assist and pregnancy/lactation safety profiles as draft-only support.
# v0.12.3 Known Limitations

- Pregnancy/lactation medication safety profiles are review-required placeholders until sourced and reviewed.
- Lactation profile is not represented as one universal letter category.
- Legacy pregnancy categories are reference metadata only; category `E` is invalid and maps to `REVIEW_REQUIRED`.
- Care Assist findings depend on currently available structured fields.
