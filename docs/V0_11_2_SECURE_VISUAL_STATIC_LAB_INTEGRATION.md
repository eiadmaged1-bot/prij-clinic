# v0.11.2 Secure Visual Static Lab Integration

Branch: `integration/v0.11.2-secure-visual-static-lab`

## Scope

This sprint integrates the completed backend/schema/security branch `fix/v0.10.9-schema-integrity-compile-and-migration` with the completed static UI branch `ui/v0.11.1-appearance-menu-tab`.

The integration keeps the backend branch as the base because it contains the passing schema/security/type/build fixes. The UI branch contributes only the static visual lab updates and supporting documentation/scripts.

## Preserved Backend And Security Work

- LAN API-base hardening remains in `apps/web/lib/api-base-url.ts`.
- Strict CORS origin parsing and usage remain in `apps/api/src/config/cors-origins.ts` and `apps/api/src/main.ts`.
- Patient document image ingest remains metadata-only by default.
- Local demo file storage remains restricted to sanitized images.
- EXIF/GPS metadata stripping remains enforced by the image sanitizer and upload tests.
- `QueueTicket.queueDate` support and queue uniqueness hardening remain in place.
- `Encounter.branchId` support remains in place.
- Encounter voiding remains in place with audit-oriented behavior.
- Queue duplicate remediation scripts remain available for local/dev/test remediation.

## Preserved Static UI Work

- `scripts/export-ui-theme-html.mjs` includes the v0.11.1 visual system.
- Static HTML opens to Dashboard first.
- No login gate is added to the static lab.
- Theme switching is local-only and persists in browser storage.
- Theme buttons live inside the `Appearance` section, not above Dashboard or clinical content.
- Appearance is reachable from the sidebar/mobile drawer.
- Theme Gallery remains a preview area.
- Patient tabs and doctor workspace tabs remain in the static lab.
- Prescription copy remains safety-only and draft-oriented.
- Drug Market remains reference-only with no cart, checkout, buy, stock, or ordering behavior.

## Integration Notes

- No backend clinical logic was changed by the UI import.
- No static UI API dependency was added.
- No real patient data, secrets, production medical claims, autonomous prescribing, AI diagnosis, or release tag was added.
- Backend/schema/security tests are expected to pass after local Prisma generation, migration deploy, seed, and service-dependent checks are run.
- Phone LAN QA still requires a physical phone on the same Wi-Fi, reachable LAN routing, and local firewall allowance.
- Staging smoke requires `APP_ENV=staging` and staging environment variables; it must not be run against an unconfigured local/demo environment.

## Verification Plan

Run:

```powershell
git diff --check
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run design:export-html
npm run design:v110:safety-check
npm run design:test-mobile-html
npm run test:db:queue-date
npm run test:db:encounter-void
npm run test:web:api-base
npm run test:security:cors
npm run test:security:image-metadata
npm run test:security:document-upload
npm run typecheck
npm run build
npm run test:v093:ui-text
npm run test:security:ci
npm run test:security:expanded
npm run test:accounts:rbac
```

If API-backed tests require local services:

```powershell
docker compose up -d postgres
npm run dev:stop
npm run dev:start
```

Then rerun the affected API-backed tests.

## Manual Static Phone QA

Run:

```powershell
npm run design:serve-html
```

Open the printed LAN URL on a phone on the same Wi-Fi and verify:

- Dashboard opens first.
- Theme buttons are not above Dashboard, Prescriptions, or other clinical content.
- Menu opens.
- Appearance exists in Menu.
- Appearance opens the theme selector.
- Theme switching works.
- Drawer closes after selecting Appearance.
- No horizontal scroll appears.
- Prescriptions remain safety-only.
- Drug Market has no cart, checkout, buy, stock, or ordering behavior.

Stop the server afterward:

```powershell
npm run dev:stop
```
