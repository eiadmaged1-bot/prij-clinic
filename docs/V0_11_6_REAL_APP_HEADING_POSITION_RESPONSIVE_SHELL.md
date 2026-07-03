# v0.11.6 Real App Heading Position Responsive Shell

Branch: `fix/v0.11.6-real-app-heading-position-responsive-shell`

## Scope

- Fixed the remaining real app responsive shell failure where primary page headings appeared too low in the viewport.
- Kept the fix limited to shell layout, route heading identification, and the local LAN profile script.
- Preserved Tailscale exact-origin behavior, CORS hardening, database schema, clinical logic, upload metadata policy, image metadata stripping, queue date, encounter branch, and encounter voiding.

No real patient data, medication dosing, AI diagnosis, AI prescribing, fake backend data, commerce wording, or release tag was added.

## Cause

The responsive shell had two related layout issues:

- On mobile and tablet widths, the shell topbar stacked Patient Search, New Patient, density controls, user controls, and logout above the route content. This pushed `/dashboard` and `/prescriptions` headings to about `704px`.
- On desktop widths, the same topbar controls could wrap inside the content column, pushing `/prescriptions` to about `298px`.

The navigation drawer itself is fixed/off-canvas below `1200px`, but the topbar chrome still reserved too much vertical height before the page heading.

## Fix

- Primary route headings now expose `data-testid="page-heading"` so the responsive test targets the visible page H1 instead of duplicate navigation/link text.
- The v0.11.4 responsive shell test prefers `[data-testid="page-heading"]`, with the existing role-based heading fallback retained.
- Below `1200px`, the app shell uses block flow while the drawer remains fixed/off-canvas and does not reserve document height when closed.
- Below `1200px`, the shell topbar is capped to compact Menu + centered brand behavior; topbar search/actions are not allowed to stack above route content.
- At desktop widths, topbar wrapping is reduced and density controls are removed from the topbar flow so content starts near the top.
- `body` keeps horizontal overflow hidden while main content and side navigation retain internal sizing constraints.
- `scripts/dev-lan-profile.ps1` now uses strict-mode-safe array counting and rejects blank host input with `[string]::IsNullOrWhiteSpace($HostIp)`.

## Verification

Run on July 3, 2026 with the LAN profile:

```powershell
npm run dev:stop
powershell -ExecutionPolicy Bypass -File scripts/dev-lan-profile.ps1 -HostIp 100.127.4.46
npm run wait:local-app
npm run test:v115:lan-smoke
npm run test:v114:responsive-shell
npm run design:test-mobile-html
npm run test:web:api-base
npm run test:security:cors
npm run test:web:hydration-root
npm run test:security:image-metadata
npm run test:security:document-upload
npm run test:db:queue-date
npm run test:db:encounter-void
npm run typecheck
npm run build
npm run test:v093:ui-text
```

Results:

- `npm run test:v115:lan-smoke`: pass.
- `npm run test:v114:responsive-shell`: pass, 17/17.
- `npm run design:test-mobile-html`: pass, 6/6.
- `npm run test:web:api-base`: pass.
- `npm run test:security:cors`: pass.
- `npm run test:web:hydration-root`: pass.
- `npm run test:security:image-metadata`: pass.
- `npm run test:security:document-upload`: pass.
- `npm run test:db:queue-date`: pass.
- `npm run test:db:encounter-void`: pass.
- `npm run typecheck`: pass.
- `npm run build`: pass.
- `npm run test:v093:ui-text`: pass.

## LAN Profile Status

The LAN profile script starts with:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev-lan-profile.ps1 -HostIp 100.127.4.46
```

It printed exact local development origins for:

- Web: `http://100.127.4.46:3000`
- API: `http://100.127.4.46:3001`
- CORS: `http://localhost:3000,http://127.0.0.1:3000,http://100.127.4.46:3000`

The script no longer fails on strict-mode `.Count` usage.
