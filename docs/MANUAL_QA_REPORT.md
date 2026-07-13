# Manual QA Report

Date: 2026-07-13 (Africa/Cairo). Branch: `fix/v1.4.2-doctor-core-merged-lock`.

This is development QA with synthetic automated fixtures only. It is not production, privacy, deployment, or clinical-safety signoff.

## Final automated verification

Passed:

- `npm run prisma:repair`
- `npm run prisma:seed`
- `npm run typecheck`
- `npm run build` (78 web routes generated)
- `npm run test:security:ci` — 25 pass, 2 warnings, 0 failures
- `npm run test:security:expanded` — 6 suites pass; route authorization 346 pass/8 warnings, audit assertions 33 pass, AI regression 10 pass/1 warning
- `npm run test:theme:ui` — 10 pass
- `npm run test:doctor:ux` — 12 pass
- `npm run test:visual:qa` — 8 pass
- `npm run test:clinical:persistence` — 17 pass
- `npm run test:obgyn:core` — 11 pass
- `npm run test:accounts:rbac` — 18 pass
- `npm run test:ai:regression` — 10 pass/1 warning
- `npm run test:e2e:v01` — 17 pass/1 warning
- `npm run test:smart-tags`, `test:doctor-visit`, `test:investigation-workflow`, `test:prescription-builder`, `test:prescription-print`, `test:medication-reference`, and `test:medication-import` — all pass
- `npm run test:external-intake` — HMAC, validation, replay, idempotency, matching, dry run, RBAC, and audit pass
- Role operations, P0 shell/session/guideline, receptionist, visual-density, patient-directory/workspace, and desktop design contracts — pass

Expected warnings identify synthetic fallback fixtures, broadly authenticated routes without a denied-role case, and an existing patient-to-doctor assignment-model limitation. No warning was converted into a fake pass.

Blocked:

- `npm run test:staging:smoke` correctly refuses to run without `APP_ENV=staging`; the local staging retry then correctly refused because no environment-managed staging demo passwords are configured.

Earlier superseded results: an old clinical-request check expected a removed hard-coded demo login, and a medication-selection check ran without an API. The current running-stack security, clinical-persistence, UI, and medication contracts supersede those environment/stale-contract failures.

## Desktop QA

`npm run test:desktop-role-qa` passed 12/12 Chromium cases:

| Role | 1366×768 | 1440×900 | 1920×1080 | 2560×1440 |
| --- | --- | --- | --- | --- |
| Owner | Pass | Pass | Pass | Pass |
| Doctor | Pass | Pass | Pass | Pass |
| Receptionist | Pass | Pass | Pass | Pass |

Checks covered authenticated shell stability, 240–260px desktop sidebar, main content beside the sidebar, no horizontal overflow, no visible Next.js crash overlay, compact KPI/card bounds, and role landing content. QA exposed and fixed duplicated desktop top-bar branding, viewport-scaled giant KPI cards, a Doctor-only 403 caused by fetching Owner summary data, and a session-hydration measurement race.

Patient history/search, visit steps, investigation favorites, prescription templates, A5 print isolation/language/overflow, and medication selection are covered by focused automated contracts. Exact approved A5 artwork placement cannot be manually approved because no final template asset exists in the repository.

## Public/ngrok QA

URL tested: `https://regretful-unwomanly-silliness.ngrok-free.dev`.

Verified:

- `/login`, `/doctor`, `/reception`, `/patients`, `/clinical-tags`, `/prescriptions`, `/investigations`, `/medications`, `/guidelines`, and `/external-intake` returned HTTP 200 HTML.
- Returned HTML contained no `Unhandled Runtime Error`, `Application error`, or `stack trace` text.
- Invalid-signature synthetic dry-run request to `/api/backend/external-intake/google-form` returned 403.
- Public TCP port 3001 was closed or filtered.

Blocked/failed:

- `/api/backend/health` returned 404, so the tunnel is not a healthy end-to-end mapping to the current clinic API.
- Authenticated role workflows, patient file, QR/mobile workflow, and valid signed webhook dry run cannot be claimed through this tunnel.
- No `PRIJ_EXTERNAL_INTAKE_SECRET` is configured in the current environment, so a valid signature was not generated. No secret was invented, read from a sheet, or exposed.

No second public tunnel was created. Real patient data must not be used through this tunnel.
