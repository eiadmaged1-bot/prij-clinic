# v0.9.3 Automated QA + Stability Hardening Report

Branch: `hardening/v0.9.3-automated-qa-stabilization`

Base branch target: `ui/v0.9.2-prij-heritage-theme-and-medication-declutter`

Date: 2026-07-01

## Scope

v0.9.3 adds browser-free automated QA coverage for the v0.9.2 Prij Heritage and medication declutter branch. The sprint does not add medication importers, retail scraping, external AI calls, autonomous prescribing, patient dosing instructions, checkout, ordering, stock, or a real payment gateway.

The app remains a local demo and is not production-ready.

## New scripts

- `npm run test:v093:routes` - fetches important visible pages and fails on 500s, missing pages, raw JSON responses, stack traces, conflict markers, and crash overlay text.
- `npm run test:v093:ui-text` - scans frontend app/component/lib source for obvious code-like or developer-only wording in normal UI.
- `npm run test:v093:patient-create` - API-backed fake/demo patient creation check plus patient workspace route and tab visibility checks.
- `npm run test:v093:medication-ui` - medication and drug-market source/runtime declutter regression check.
- `npm run test:v093:roles` - API-backed owner/doctor/non-clinical role visibility and denial checks where feasible.
- `npm run dev:diagnose` - PowerShell diagnostic for Docker, PostgreSQL, ports, API/DB health, local env-file presence, Prisma client folders, and stale Node processes. It does not print secret values.
- `npm run test:v093:release` - final validation runner for when Docker/PostgreSQL are available. It validates only and does not commit, tag, push, reset the database, or run `docker compose down -v`.
- `powershell -ExecutionPolicy Bypass -File scripts/v093-release-commands.ps1` - guarded release command helper. Without `-RequireAllChecksPassed`, it prints instructions only.

## Release status

v0.9.3 is not released yet.

No release commit, release tag, or tag push has been completed. The tag `v0.9.3-automated-qa-stabilization` must not be created until the API-backed checks pass without `V093_ALLOW_ENV_SKIP=1`.

## Route QA coverage

The route QA covers:

`/`, `/login`, `/dashboard`, `/patients`, `/patients/new`, `/calendar`, `/appointments`, `/queue`, `/doctor`, `/doctor/visit`, `/billing`, `/finance`, `/admin`, `/owner-control`, `/orders`, `/medications`, `/medications/search`, `/medications/families`, `/medications/herbals`, `/medications/safety`, `/drug-market`, `/drug-market/search`, `/admin/drug-market`, `/admin/drug-market/coverage`, `/admin/drug-market/automation`, `/admin/drug-market/review-queue`, `/consents`, `/investigations`, `/reports`, `/pregnancy`, `/ob-ultrasounds`, `/guidelines`, `/protocol-atlas`, `/calculators`, and `/ai-drafts`.

Latest local result with Next web server running:

```text
V093-ROUTE SUMMARY PASS 35 WARN 0 FAIL 0
```

## UI text sweep

Latest local result:

```text
V093-UI-TEXT PASS scanned 99 frontend files
V093-UI-TEXT SUMMARY PASS 1 WARN 0 FAIL 0
```

The sweep allows intentional user-facing wording such as `Local Demo`, `not production-ready`, `Role`, `Permission` in admin/security settings, `Source-tracked`, `Verified`, `Needs review`, `Bahrain data`, and `Oman data`.

## Patient creation check

The check uses only fake/demo values and seeded local owner/admin credentials. It verifies:

- API health.
- Local demo owner/admin login.
- `POST /patients` returns an id.
- `GET /patients/:id` returns the created fake/demo patient.
- `/patients/:id` route exists.
- Patient workspace tab source includes core visible tabs.

Latest local result in this session:

```text
V093-PATIENT SUMMARY PASS 0 WARN 0 FAIL 1
V093-PATIENT FAIL patient creation flow - fetch failed
```

Cause: Docker Desktop/PostgreSQL was not reachable in this environment, so the API could not be started or seeded.

Current behavior:

- Default behavior fails nonzero when the API, PostgreSQL, or Docker-backed local environment is unavailable.
- `V093_ALLOW_ENV_SKIP=1 npm run test:v093:patient-create` may be used only as a local environment skip to keep browser-free checks moving on blocked machines.
- A skip/warn result is not release-validating and forbids release tagging until the check passes without the skip variable.

## Medication declutter check

Latest local result with Next web server running:

```text
V093-MED-UI SUMMARY PASS 5 WARN 0 FAIL 0
```

The check keeps normal medication and drug-market pages free of raw parser confidence, raw row hashes, raw official field dumps, raw price fields, stock/order/checkout/purchase wording, and patient dosing instructions generated from market strength/form metadata.

Admin-only review/import/coverage pages may still use review, source, import, verification, confidence, and official source concepts where appropriate.

## Role visibility check

The check uses seeded demo roles and API direct checks. It verifies feasible access and denial behavior for owner/admin, doctor, receptionist, and accountant.

Latest local result in this session:

```text
V093-ROLES SUMMARY PASS 0 WARN 0 FAIL 1
V093-ROLES FAIL role visibility regression - fetch failed
```

Cause: Docker Desktop/PostgreSQL was not reachable in this environment, so the API could not be started or seeded.

Current behavior:

- Default behavior fails nonzero when the API, PostgreSQL, or Docker-backed local environment is unavailable.
- `V093_ALLOW_ENV_SKIP=1 npm run test:v093:roles` may be used only as a local environment skip to keep browser-free checks moving on blocked machines.
- A skip/warn result is not release-validating and forbids release tagging until the check passes without the skip variable.

## Baseline verification status

Passing in this session after Prisma client repair:

```text
git diff --check
npm run prisma:repair
npm run typecheck
npm run build
npm run test:v093:routes
npm run test:v093:ui-text
npm run test:v093:medication-ui
```

Blocked in this session:

```text
docker compose up -d postgres
npm run prisma:seed
npm run test:v093:patient-create
npm run test:v093:roles
```

Docker error:

```text
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
```

## Finish commands for Docker-available machine

Run diagnostics first:

```powershell
npm run dev:diagnose
```

Then run the final validation gate:

```powershell
npm run test:v093:release
```

Only after every check passes without `V093_ALLOW_ENV_SKIP=1`, inspect the guarded helper:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/v093-release-commands.ps1 -RequireAllChecksPassed
```

The helper prints the release commands but is not called by tests.

## Existing requested test sweep status

The existing full sweep was attempted, but the grouped command timed out while running `test:visual:qa`. The stale visual QA Node process was stopped. Because Docker/PostgreSQL was unavailable, DB/API-backed tests could not be completed honestly in this session.

Known existing scripts from the requested list:

- `smoke:test`
- `test:security`
- `test:security:ci`
- `test:security:expanded`
- `test:theme:ui`
- `test:doctor:ux`
- `test:visual:qa`
- `test:e2e:v01`
- `test:clinical:persistence`
- `test:obgyn:core`
- `test:accounts:rbac`
- `test:ai:regression`
- `test:staging:smoke`
- `test:medications`
- `test:drug-market`
- `test:medication-intelligence`

No requested script from that list was missing from `package.json`.

## Remaining manual QA

Manual browser QA is still required when the owner returns:

- Login and logout flows.
- Dashboard shell and Prij Heritage visual density.
- Patient creation form and patient workspace usability.
- Calendar, appointments, queue, doctor workspace, guided visit, orders, finance, billing, reports, consents.
- Medication reference and drug-market product profile readability.
- Owner/admin drug-market review, coverage, automation, and review queue screens.
- Role-based navigation visibility in a real browser session for owner/admin, doctor, receptionist, accountant, and nurse.

## Safety status

- No real patient data was used.
- No real payment gateway was added.
- No external AI calls were added.
- No autonomous diagnosis or prescribing was added.
- No patient dosing instructions were generated from market strength/form metadata.
- No stock, order, checkout, purchase, or retail scraping behavior was added.
- Medication data remains official/reference metadata only.
- Doctor approval remains mandatory for clinical decisions.
