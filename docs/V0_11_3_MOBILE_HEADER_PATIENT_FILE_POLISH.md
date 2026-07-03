# v0.11.3 Mobile Header + Patient File Polish

Branch: `ui/v0.11.3-mobile-header-patient-file-polish`

## Summary

- Fixed the phone QA issue where the mobile header placed Menu on the right and pushed the Prij Clinic brand off center.
- Updated the static HTML mobile header to use a compact left Menu button, centered Prij Clinic / UI Lab brand block, and a right-side spacer for visual balance.
- Fixed the Patient File mobile tab strip so the first and last tabs remain readable, the active tab scrolls into view, and horizontal scrolling is limited to the tab strip.
- Reduced the mobile Patient File hero density and made the `Doctor Workspace` button less dominant on phones.

## Scope Boundaries

- Static HTML generator and generated design handoff only.
- No backend, API, database, schema, CORS, image metadata stripping, QueueTicket.queueDate, or Encounter.branchId changes.
- No API calls, real authentication, real patient data, medication dosing, AI diagnosis, AI prescribing, cart, checkout, or buy wording were added.
- Prescription safety wording remains in place.
- No release tag was created.

## Verification

- `git diff --check` passed with line-ending normalization warnings only.
- `npm run design:export-html` passed.
- `npm run design:v110:safety-check` passed.
- `npm run design:test-mobile-html` passed: 6 tests passed.
- `npm run test:v093:ui-text` passed: scanned 100 frontend files, 1 pass, 0 warnings, 0 failures.
- `npm run typecheck` passed for API, web, and shared workspaces.
- `npm run build` passed for API, web, and shared workspaces.
- `npm run design:serve-html` was started locally and `http://localhost:4174` returned HTTP 200.

## Manual QA Notes

- Local static server should be used for phone QA: `npm run design:serve-html`.
- Phone QA should verify Menu is on the left, the logo is centered, Patient File tabs are not clipped, the page has no horizontal body scroll, Appearance still works, and theme switching persists.
