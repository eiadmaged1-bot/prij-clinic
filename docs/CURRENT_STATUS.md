# Current Status

v0.12.6 Medication Safety Source Import + Review Workflow is in progress on branch `feature/v0.12.6-medication-safety-source-import-review`.

v0.12.6 status:
- Owner/Admin medication safety source import preview and commit endpoints are added.
- Accepted imported rows are written as `needs_review` by default and never marked reviewed automatically.
- Review queue supports approve, reject, and retire decisions with required reason and audit logging.
- Approval requires source metadata; reviewer and reviewed time are server-owned.
- Prescription safety terminal shows reviewed source metadata and review-required status without dosing or prescribing automation.
- Category `E` maps to `REVIEW_REQUIRED` with a warning and is not a valid pregnancy category.
- No web scraping, retail/pharmacy sources, fake pregnancy/lactation claims, autonomous prescribing, dosing, diagnosis, treatment ranking, external AI runtime call, DB reset, release tag, or raw source file commit is added.

v0.12.1 Clean Database + Real Reference Foundation is in progress on branch `data/v0.12.1-clean-db-reference-foundation`.

v0.12.1 status:
- Adds guarded local/dev/test database inventory, cleanup, baseline, verification, and test scripts for a clean local clinic baseline.
- Cleanup is dry-run by default and apply is fail-closed outside local/dev/development/test/CI.
- Cleanup preserves users, roles, permissions, owner/admin accounts, branches, audit logs, migrations, clinical protocols, guidelines, medication/drug-market reference/import tables, investigation catalog, service catalog, operation catalog, and system settings.
- Adds an operation/procedure catalog for surgical history and expands investigation/service reference foundations.
- Service catalog rows can be unpriced with `price_review_required`; seeded services do not use fake prices.
- Medication readiness reports official and verified counts honestly. If official rows are zero, it warns and does not create fake medication rows.
- Adds authenticated read-only `/reference/investigations`, `/reference/operations`, `/reference/services`, and `/reference/medication-readiness` endpoints.
- No fake patients, encounters, prescriptions, invoices, appointments, investigation results, medication rows, dosing automation, AI diagnosis, AI prescribing, stock/cart/checkout/buy workflow, CORS weakening, or release tag is added.

v0.12.0 Real App Clinic Workspace Upgrade is in progress on branch `leap/v0.12.0-real-app-clinic-workspace-upgrade`.

v0.12.0 status:
- Real app navigation now follows clinic workflow groups: Today, Patients, Clinical, Operations, Knowledge, Medication Reference, and Admin.
- Reusable real-app clinic/layout primitives were added under `apps/web/components/clinic` and `apps/web/components/layout`.
- Shared workflow pages inherit cleaner bounded panels, safer local-workflow copy, and honest empty states through `MvpPage`.
- Dashboard no longer shows hardcoded medication-reference counts; it points to reference availability and doctor-controlled prescription behavior.
- Patient registration and patient-file action wording no longer shows fake patient/contact placeholders or default clinical test values.
- Added `scripts/v120-real-app-no-fake-ui-data-check.mjs`, `npm run test:v120:no-fake-ui`, and `tests/v120/real-app-clinic-workspace.spec.ts`.
- No database/schema, CORS, auth/RBAC, audit-log, Tailscale/LAN, image metadata, upload-policy, queue-date, encounter-branch, or encounter-voiding behavior was changed.
- No release tag has been created.

v0.11.6 Real App Heading Position + Responsive Shell Finalization is in progress on branch `fix/v0.11.6-real-app-heading-position-responsive-shell`.

v0.11.6 status:
- Fixed the remaining real app responsive failure where `/dashboard` and `/prescriptions` headings were pushed too far down by stacked shell topbar controls.
- Mobile/tablet shell topbar is compact, and the closed drawer remains fixed/off-canvas without reserving document height.
- Desktop shell topbar no longer wraps large control groups above the page heading; `/prescriptions` now stays under the existing `<260px` target.
- Dashboard and prescriptions primary headings now expose `data-testid="page-heading"` and the v0.11.4 responsive test targets that primary visible heading without raising thresholds.
- `scripts/dev-lan-profile.ps1` was verified under strict mode with `-HostIp 100.127.4.46` and now uses safe array counting.
- Verification passed: `npm run test:v115:lan-smoke`, `npm run test:v114:responsive-shell`, `npm run design:test-mobile-html`, `npm run test:web:api-base`, `npm run test:security:cors`, `npm run test:web:hydration-root`, `npm run test:security:image-metadata`, `npm run test:security:document-upload`, `npm run test:db:queue-date`, `npm run test:db:encounter-void`, `npm run typecheck`, `npm run build`, and `npm run test:v093:ui-text`.
- No CORS weakening, Tailscale wildcard behavior, database/schema change, clinical logic change, upload policy change, medication dosing, AI diagnosis/prescribing, real patient data, fake backend data, commerce wording, or release tag was added.

v0.11.5 Real App Responsive Shell + Tailscale LAN Login Stability is in progress on branch `integration/v0.11.5-real-app-tailscale-responsive-login`.

v0.11.5 status:
- Real Next.js app shell now uses desktop sidebar at `>=1200px` and topbar/drawer below that, preventing the navigation from becoming a large full-width grid above content.
- Dashboard Patient Search topbar control is bounded to normal card/input size and wraps with New Patient, Local Demo, density controls, owner badge, and logout controls.
- `/prescriptions` inherits the stable app shell and remains safety/reference-only with no commerce or dosing automation wording.
- Root `<html>` uses `suppressHydrationWarning` to tolerate browser/Tailscale tooling attributes such as `__gcrremoteframetoken`.
- Tailscale phone dev uses explicit exact host configuration only; `100.64.0.0/10` wildcard/subnet CORS remains rejected.
- No backend clinical/schema changes were made beyond LAN runtime binding/configuration.

v0.11.3 Mobile Header + Patient File Polish is in progress on branch `ui/v0.11.3-mobile-header-patient-file-polish`.

v0.11.3 status:
- Mobile static HTML header now uses a compact left Menu button, centered Prij Clinic / UI Lab brand, and a right-side spacer to keep the brand visually centered.
- Patient File mobile tabs now constrain horizontal scrolling to the tab strip, keep first/last tabs readable, and scroll the active tab into view when selected.
- Patient File mobile hero is more compact, with a smaller PF badge and less oversized `Doctor Workspace` button.
- Static UI remains API-free and preserves Dashboard-first behavior, Appearance in the mobile drawer, local theme persistence, drawer close after navigation, prescription safety-only content, and non-commerce drug-market wording.
- No backend, API, database, schema, CORS, image metadata stripping, `QueueTicket.queueDate`, `Encounter.branchId`, real patient data, real auth, medication dosing, AI diagnosis, AI prescribing, commerce wording, or release tag was added.
- Verification passed: `git diff --check` with line-ending warnings only, `npm run design:export-html`, `npm run design:v110:safety-check`, `npm run design:test-mobile-html`, `npm run test:v093:ui-text`, `npm run typecheck`, and `npm run build`.

v0.11.2 Secure Visual Static Lab Integration is in progress on branch `integration/v0.11.2-secure-visual-static-lab`.

v0.11.2 status:
- Integrated backend/schema/security hardening from `fix/v0.10.9-schema-integrity-compile-and-migration` with static visual UI work from `ui/v0.11.1-appearance-menu-tab`.
- LAN API-base and strict CORS hardening remain backend-owned and unchanged by the static UI import.
- Patient document image ingest remains metadata-only by default with EXIF/GPS stripping and local demo file storage restricted to sanitized output.
- Schema integrity hardening remains in place: `QueueTicket.queueDate`, required `Encounter.branchId`, encounter voiding, and queue duplicate remediation/test coverage.
- Static UI lab includes the v0.11.1 Appearance tab, mobile drawer Appearance navigation, Dashboard-first behavior, no login gate, local theme persistence, patient tabs, doctor workspace tabs, and safety-only prescription/drug-market wording.
- Static UI remains local HTML only and does not add API calls, backend clinical logic changes, real authentication, real patient data, medication dosing, AI diagnosis, AI prescribing, commerce behavior, or a release tag.
- Phone LAN QA still requires a physical device on the same Wi-Fi and local firewall/network routing.
- Staging smoke is not part of this integration unless `APP_ENV=staging` and proper staging environment variables are configured.

v0.10.9 Schema Integrity Compile + Migration Remediation is in progress on branch `fix/v0.10.9-schema-integrity-compile-and-migration`.

v0.10.9 status:
- Queue ticket creation uses UTC date-only `queueDate` values, and seeded demo queue tickets now set `checkedInAt` plus `queueDate` explicitly.
- Encounter creation keeps the required `branchId` from patient branch context and fails safely if branch context is missing.
- Raw-SQL local remediation scripts were added for legacy duplicate queue tickets before/around the queue-date migration boundary.
- The configured local DB currently has no duplicate queue groups; ticket `9fb69f14-399a-41d9-b944-d88991e16bee` remains queue `1`, and ticket `61cbcf2e-136f-4d2f-8a3b-014dac6ece3b` is preserved at queue `10`.
- `npm run prisma:migrate:deploy` reports no pending migrations; schema hardening has a successful local migration row finished at `2026-07-03T09:12:53.515Z`.
- No DB reset, queue-ticket delete, table drop, migration guard bypass, schema weakening, release tag, real patient data, or production medical claim was added.
- Requested DB/API/security/type/build tests passed locally; see `docs/V0_10_9_SCHEMA_INTEGRITY_REMEDIATION.md`.

v0.10.5 LAN CORS Hardening is in progress on branch `security/v0.10.5-lan-cors-hardening`.

v0.10.5 status:
- Frontend API base URL resolution is explicit-env first and supports localhost, configured private LAN IP, and configured `.local` development profiles.
- Browser LAN same-host fallback is local-development only and requires `NEXT_PUBLIC_ALLOW_LAN_API_FALLBACK=true`.
- Backend CORS parsing uses exact origins by default and separates dev-only private CIDR matching into `CORS_PRIVATE_CIDRS` plus `CORS_PRIVATE_PORTS`.
- Staging/production reject wildcard, CIDR, and dynamic LAN behavior; missing exact origins fail closed.
- No clinical logic, database schema, real patient data, external AI, RBAC, audit, auth, or medication safety behavior is changed.

v0.11.1 Appearance Menu Tab is in progress on branch `ui/v0.11.1-appearance-menu-tab`.

v0.11.1 status:
- Static theme switching moved into a dedicated `Appearance` section with the `VISUAL SETTINGS` eyebrow.
- The inline top-of-page theme selector was removed from the main static shell, so Dashboard and clinical sections no longer start below theme buttons on mobile.
- Appearance is available from the sidebar/mobile drawer near Admin and Theme Gallery areas, while Dashboard remains the default first screen.
- Theme switching remains local-only, immediate, persisted in localStorage, and visibly marks the active theme.
- Generated static outputs were regenerated for `ui-export/index.html`, `ui-export/assets/*`, `docs/design/prij-ui-theme-lab.html`, and `docs/design/prij-mobile-ui-lab.html`.
- Verification passed for `git diff --check` with line-ending warnings only, `npm run design:export-html`, `npm run design:v110:safety-check`, `npm run design:test-mobile-html`, and `npm run test:v093:ui-text`.
- `npm run typecheck` and `npm run build` still fail in existing API Prisma create inputs requiring `branchId` and `queueDate`; backend code was not changed in this sprint.
- No backend, database schema, clinical logic, real auth, API calls, CORS/security hardening, image sanitizer, real patient data, medication dosing, AI diagnosis, AI prescribing, commerce workflow, release tag, or production claim is added.

v0.11.0 Visual Upgrade Import is in progress on branch `ui/v0.11.0-visual-upgrade-import`.

v0.11.0 status:
- Static design reference ZIP inspected: `incoming/visual-upgrade/prij-clinic-visual-upgrade-v0_11.zip`.
- Visual system imported into `scripts/export-ui-theme-html.mjs`; raw ZIP HTML was not used as an app replacement.
- Generated static lab keeps Dashboard-first behavior, no login gate, local navigation, mobile drawer, theme switching, patient tabs, and safety-only prescription/drug-market wording.
- Generated outputs remain `ui-export/index.html`, `ui-export/assets/*`, `docs/design/prij-ui-theme-lab.html`, and `docs/design/prij-mobile-ui-lab.html`.
- Added `npm run design:v110:safety-check` for generated HTML/CSS/JS safety scanning.
- No backend, database schema, clinical logic, real auth, API calls, CORS/security hardening, image sanitizer, storage policy, real patient data, medication data, AI diagnosis, AI prescribing, commerce workflow, generated ZIP, screenshot, or release tag is added.

v0.10.4 Mobile-Stable Static HTML Lab is in progress on branch `ui/v0.10.4-mobile-stable-html-lab`.

v0.10.4 status:
- Static HTML lab now targets `ui-export/index.html` as the handoff entry point.
- The lab opens to Dashboard and uses section/hash navigation without API calls or page reloads.
- Mobile widths use a touch drawer with overlay close and nav-tap close behavior.
- Theme switching is local-only, immediate, persisted in localStorage, and available on phone.
- Static server command `npm run design:serve-html` serves only `ui-export` and prints localhost/LAN URLs for phone testing.
- Mobile Playwright coverage is added under `tests/v104/static-html-mobile.spec.ts`.
- No backend, database, real auth, real patient data, medication data, uploads, external AI, release tag, or production-ready claim is added.

v0.10.2 Mobile Browser Usability + LAN Phone QA is in progress on branch `ui/v0.10.2-mobile-browser-usability`.

v0.10.2 status:
- Mobile shell now uses a topbar menu button and slide-out drawer while desktop keeps the sidebar.
- Shared CSS was hardened against 360px horizontal overflow with safer wrapping, shrinkable flex/grid children, full-width phone controls, and scrollable patient tabs.
- Key patient, admin, drug-market import, guideline, protocol, orders, and investigation views inherit mobile card/form behavior.
- LAN phone browsing is documented in `docs/MOBILE_LAN_TESTING.md`.
- Mobile Playwright QA was added under `tests/v102` with `expectNoHorizontalOverflow`.
- Official medication rows remain 0 locally; no medication data, fake rows, external AI, real patient data, real payment gateway, release tag, or production CORS weakening was added.

v0.10.1 Official Medication Import Operator is in progress on branch `data/v0.10.1-official-medication-import-operator`. The old project medication artifact is unavailable and cannot be recovered from current project artifacts, so the app is being prepared for a real authorized official-medication import session instead of recreating rows.

v0.10.1 status:
- Admin page `/admin/drug-market/import` now shows official row counts, verified count, needs_review count, local inbox path, accepted file types, and dry-run-first operator commands.
- Local inbox: `storage/official-medication-sources/`.
- Official medication rows remain 0 until authorized official files are added and imported.
- Prescription medication selection remains blocked until verified or needs_review official rows exist.
- No fake medication rows, generated medication lists, patient dosing instructions, stock/order/checkout sources, real patient data, external AI, or release tag were added.

v0.10.0 Official Medication Re-Import is in progress on branch `data/v0.10.0-official-medication-reimport`. It documents the official source registry, adds dry-run-first source acquisition into ignored local storage, adds a source-specific parser framework for Bahrain NHRA/Oman MOH/generic official spreadsheets, and adds synthetic parser fixtures only. Current local source acquisition list is empty, so no official file dry-run import or apply import was performed. Official medication rows remain 0 and verified medication rows remain 0.

v0.10.0 safety status:
- No fake medication rows were created.
- No AI-generated medication list was used.
- No retail, stock, cart, checkout, order, login, CAPTCHA, or paywall source was used.
- Imported rows will default to `needs_review` unless a reviewed source explicitly contains prior project verified status.
- Strength/form/pack remains market metadata only and never patient dosing instructions.
- Strict medication readiness remains blocked until official rows exist.

v0.9.9 Medication Provenance Recovery is in progress on branch `data/v0.9.9-medication-provenance-recovery`. It adds read-only provenance scanning, a guarded recovery-DB export helper, and a guarded recovered official medication import workflow. The scan found historical medication refs and tooling but no recoverable raw official export or old running DB with official rows. Current local official medication rows remain 0 and verified medication rows remain 0. No recovered export was created, no import was applied, and no fake medication rows were created.

v0.9.9 search result:
- Git medication-related refs found: 35.
- Git file hits were scripts/docs/source code, not committed raw official medication exports.
- Local project/worktree copies and `C:\Users\SuperUser` were searched for medication provenance paths.
- Docker current `prij-clinic-postgres` reported `DrugMarketVariant total=15`, official non-demo rows 0, verified 0, needs_review 0.
- Six project Postgres volumes were metadata-inspected, but not attached to a new server because that can mutate Postgres recovery state.
- Remaining blocker: the previous export/old DB artifact containing the 8,269 official rows is not available in this workspace.

v0.9.7 Reference Data Restore + Prescription Trial Readiness is in progress on branch `data/v0.9.7-reference-data-restore-prescription-readiness`. It adds guarded official medication source discovery/restore orchestration, medication/guideline/account/prescription readiness checks, and a CI readiness gate. Official medication rows must come from previous approved exports or owner-provided official files; absent sources are reported honestly and no fake official medication rows are created.

v0.9.6 Local Demo Database Finalization is in progress on branch `data/v0.9.6-local-demo-db-finalization`. The guarded v0.9.5 local cleanup was applied with `APP_ENV=local` after a clear dry run. Baseline targeted 602 clearly demo/test/local patients and linked operational records; after cleanup, `npm run db:v095:audit` reported 0 patient-linked operational rows while preserving users, roles, permissions, `eyad`, audit logs, investigation catalog rows, medication reference/drug-market tables, service catalog, and setup/reference data.

v0.9.6 verification status:
- PASS: `npm run prisma:repair`
- PASS: `npm run prisma:migrate:deploy`
- PASS: `npm run prisma:seed`
- PASS: `npm run db:v095:audit` after cleanup
- PASS/WARN: `npm run db:v095:verify-reference` passes with warnings for unavailable API endpoint checks and absent official medication rows.
- PASS/WARN: `npm run db:v096:ready-check` passes with warnings for unavailable API endpoint checks and absent official medication rows.
- Investigation catalog count: 63, including key OB/GYN investigation names.
- `eyad` remains present, active, protected, Owner, and System Owner-authorized.
- Doctor, Receptionist, Nurse, and Accountant account creation support is present in backend DTO/source and `/admin/accounts` UI. Endpoint proof still requires the API to be running.
- Official medication rows are absent in this local DB; next step is restore/import official data, not fake rows.
- No release tag has been created, and manual browser QA remains required.

v0.9.5 Data Hygiene + Reference Catalog + Eyad Account Authority is in progress on branch `data/v0.9.5-clean-reference-data-account-authority`. It adds guarded database audit/cleanup scripts, an investigation reference catalog seed, verification for reference-data preservation, and clearer Eyad protected account authority checks. It is not a release, no tag has been created, and final manual QA remains required.

v0.9.5 safety status:
- Demo cleanup is dry-run by default and targets only clearly demo/test/local patient-linked operational data.
- Medication reference and official drug-market rows are preserved.
- Investigation catalog/reference names are preserved and seeded as order/catalog names only.
- `eyad` remains the protected local demo System Owner and can create local demo staff accounts for testing through the guarded account-management flow.
- No real patient data, external AI, real payment gateway, retail checkout/stock/order behavior, autonomous prescribing, or medication dosing instructions were added.

v0.9.4 Automated Browser Journey QA is in progress on branch `qa/v0.9.4-automated-browser-journey`. It adds Playwright Chromium browser journeys for login, dashboard, fake/demo patient creation, patient workspace tabs, clinic workflow pages, medication/drug-market declutter, and role visibility. It is QA infrastructure only: no release tag has been created, v0.9.3 is still not final, manual browser QA is still required, and Docker/PostgreSQL local validation remains a separate release blocker.

v0.9.3 Automated QA + Stability Hardening is now a release candidate on branch `hardening/v0.9.3-automated-qa-stabilization`. It is not a final release, no release tag has been created, and release tagging is forbidden until final local Docker/PostgreSQL release validation and manual browser QA pass without `V093_ALLOW_ENV_SKIP=1`.

Release-candidate status:
- CI Release Gate: passed.
- Normal CI: passed.
- v0.9.3 status: release candidate, not final release.
- Local Docker/PostgreSQL release validation: pending.
- Manual browser QA: pending.
- Release tag: not created.
- Release-candidate base commit before the QA pack: `5b65630d39a6af035eaa089a1db54584243e7f92`.

CI release gate status:
- `.github/workflows/v093-release-gate.yml` adds the `v0.9.3 Release Gate` workflow for the hardening branch, pull requests targeting `ui/v0.9.2-prij-heritage-theme-and-medication-declutter`, and manual dispatch.
- The workflow uses a demo-only PostgreSQL 16 service database, applies existing migrations, seeds demo data, starts the built API and web app, and runs the v0.9.3 automated QA.
- `V093_ALLOW_ENV_SKIP=1` is intentionally absent from the workflow. CI must fail if API/DB-backed checks cannot run.
- The workflow does not create a release tag and does not replace final local DB/API validation or manual browser QA.

Automated browser-free QA added:
- `npm run test:v093:routes` verifies 35 important visible routes return clean HTML without 500s, raw JSON, conflict markers, stack traces, or runtime crash text.
- `npm run test:v093:ui-text` scans normal frontend source areas for obvious code-like/developer text in visible UI.
- `npm run test:v093:patient-create` verifies fake/demo patient creation, detail fetch, workspace route, and patient workspace tab source when the API and seeded DB are available.
- `npm run test:v093:medication-ui` verifies normal medication and drug-market UI stays decluttered and free of technical/source/price/debug, commerce, stock, checkout, and dosing-instruction clutter.
- `npm run test:v093:roles` verifies feasible owner/admin, doctor, receptionist, and accountant access/denial behavior when the API and seeded DB are available.
- `npm run dev:diagnose` reports local Docker/PostgreSQL/API/port/env/Prisma readiness without printing secrets.
- `npm run test:v093:release` runs the final v0.9.3 validation sequence when Docker/PostgreSQL are available. It does not commit, tag, push, reset the database, or remove Docker volumes.

Latest automated QA status:
- PASS: GitHub Actions `v0.9.3 Release Gate`
- PASS: normal GitHub Actions CI
- PASS: `npm run typecheck`
- PASS: `npm run build`
- PASS: `npm run test:v093:routes` with Next web server running
- PASS: `npm run test:v093:ui-text`
- PASS: `npm run test:v093:medication-ui` with Next web server running
- BLOCKED: API/DB-backed checks because Docker Desktop/PostgreSQL was not reachable from this session.
- PENDING: final local `npm run dev:diagnose`
- PENDING: final local `npm run test:v093:release`
- PENDING: manual browser QA
- API-backed checks now print explicit `ENVIRONMENT BLOCKER` messages by default and fail nonzero. `V093_ALLOW_ENV_SKIP=1` converts only unavailable-environment failures into skip/warn exit 0 for local blocked machines; that mode is not release-validating.

See `docs/V0_9_3_AUTOMATED_QA_REPORT.md` and `docs/V0_9_3_RELEASE_CANDIDATE.md`.

Medication restore drill and verification Batch 4 for Bahrain and Oman are implemented.

v0.9.2 Prij Heritage theme and medication UI declutter is in progress on this branch:
- `prij-heritage` is registered as the default frontend theme for this branch.
- Tokens from `docs/design/prij-clinic-theme.html` are converted into app CSS variables and shell styling.
- Reusable Prij Heritage component helpers are available in `apps/web/components/prij-heritage.tsx`.
- Medication UI hides technical/source/price/debug labels from normal visible screens while preserving backend metadata.

v0.9 visible experience work is in progress on the premium clinic OS browser experience:
- Premium shell/navigation now exposes Home, Patients, Calendar, Queue, Doctor Workspace, Orders, Finance, Reports, Medications, Guidelines/Protocols, and Owner controls in role-aware groups.
- Login, dashboard, patient creation, patient workspace, reception flow, doctor flow, owner control, finance, orders, consents, and medication reference pages have visible product polish.
- Medication work remains display-only for existing v0.8.6 data; no new official source importers were added.
- Normal medication UI uses simplified trust wording such as Verified, Needs review, Source-tracked, Bahrain data, and Oman data.

Counts after v0.8.6 Batch 4:
- Bahrain NHRA: 3,169 real rows, 600 verified, 2,569 needs review.
- Oman MOH: 5,100 real rows, 600 verified, 4,500 needs review.
- Total real official rows: 8,269.
- Demo rows excluded: 23.
- Rejected/retired rows: 0/0.
- Total verified official rows: 1,200.
- Open review items: 7,069.

Review queue:
- Groups by country, source, import run, parser confidence, missing fields, duplicate risk, registration number, and candidate confidence.
- Admin/Owner can verify, reject, or retire selected rows with a reason.
- Batch verification is high-confidence-only and reason-required.
- Bahrain high-confidence candidates after batch 4 verification: 2,569.
- Oman high-confidence candidates after batch 4 verification: 4,429.
- Oman currently review-gated low-confidence/blocked candidates after batch 4 verification: 71.
- Local official medication export/verify/restore scripts are available; exports stay in ignored `storage/official-medication-exports/` and restore reports stay in ignored `storage/official-medication-restore-drills/`.
- Latest restore drill passed against `prij_clinic_medication_restore_test`.

Safety:
- Medication data remains market/reference metadata only.
- Doctor approval remains mandatory.
- No autonomous prescribing, patient dosing instructions, stock/order/checkout, retail scraping, or external AI calls.

Visible experience safety:
- The browser still states Local Demo / not production-ready.
- No real patient data, no real payment gateway, no external AI calls, and no diagnostic automation are introduced.
# V0.10.6 Image Metadata Sanitization

- Added API-boundary image sanitization for patient document uploads.
- Patient document storage remains `metadata_only` by default.
- Local demo file storage is restricted to sanitized output in local/dev/test.
- Production local patient file storage fails closed.
# Current Status

v0.12.5 Clinic Usability Lock + Medication Safety Source Review Prep is in progress on branch `feature/v0.12.5-clinic-usability-lock-source-review-prep`.

v0.12.5 status:
- Browser workflow is tightened for login, patient creation, patient workspace, doctor visit, history, Care Assist, encounter, prescription, medication safety terminal, investigations, follow-up, and packet.
- Doctor Visit now presents the stepper as History, Care Assist, Encounter, Prescription, Investigations, Follow-up, Packet.
- Prescription drafting stays generic-first and does not auto-fill dose, frequency, or duration.
- Medication safety source review prep is available for Owner/Admin review actions without adding real or fake pregnancy/lactation safety claims.
- Reviewed medication safety status requires source name and review reason; reviewer and reviewed time are saved server-side and audited.
- No autonomous diagnosis, prescribing, dosing, final plan generation, OpenAI runtime clinical calls, WhatsApp, DICOM/PACS, insurance, real payment gateway, DB reset, migration deletion, or release tag is added.

v0.12.4 Doctor Visit Flow + Care Assist E2E Hardening is in progress on branch `feature/v0.12.4-doctor-visit-flow-care-assist-e2e`.

v0.12.4 status:
- Adds `docs/PRIJ_CODING_RULES.md` as the numbered A/B/C rule control sheet.
- Adds medication safety profile freshness metadata: last checked, source last updated, source version, refresh status, and refresh note.
- Adds a doctor visit backend module for starting/opening visits, updating draft encounters, creating follow-up tasks, and generating visit packet summaries with audit events.
- Adds a Doctor Visit tab in the patient workspace with History, Care Assist, Encounter, Prescription, Investigations, Follow-up, and Print Packet steps.
- Adds a medication safety side terminal that updates from selected, hovered, or keyboard-focused medication search results.
- Keeps generic medication names visible and prescription identity generic-first.
- Adds doctor-facing clinical note buttons with explicit draft insertion only.
- Adds v0.12.4 workflow and safety wording checks.
- No fake patients, fake medication safety claims, autonomous diagnosis, autonomous prescribing, default dosing automation, WhatsApp, DICOM/PACS, billing/finance rewrite, or release tag is added.

v0.12.2 adds clinical reference catalogs and the patient history workspace on top of the v0.12.1 clean reference foundation.

Implemented:
- Generic medication catalog with 35 seeded non-controlled generic rows.
- Medication search tags/classes with 26 tags and 26 class/family rows.
- Controlled generic medication rows are not seeded by default.
- Investigation catalog has 94 active rows locally after duplicate-name consolidation; total catalog rows are 120.
- Operation catalog expanded to 55 active rows locally after seed.
- Patient history sheet backend and patient workspace History Sheet tab.
- Prescription generic-name selection via `MedicationGeneric`.

Safety boundaries remain active: no real patient data, no trade-name medication catalog, no pricing/inventory/sales wording, no automated dosing, no AI prescribing, and doctor review remains required.
# v0.12.3 Care Assist Status

- Care Assist schema, local rules, backend module, patient workspace tab, and medication safety profile UI are implemented.
- Existing generic medications have empty `REVIEW_REQUIRED` pregnancy/lactation profiles only.
- No real pregnancy/lactation safety claims are seeded.
- Care Assist remains doctor-assist only and does not diagnose, prescribe, choose drugs, dose, or rank treatments.
