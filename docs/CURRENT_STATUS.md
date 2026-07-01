# Current Status

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
