# Prij Clinic Local HTML Design Lab

The design lab exports static, standalone HTML previews of the Prij Clinic UI direction. The files are visual prototypes only and are not the production app.

## Files

- `docs/design/prij-ui-theme-lab.html` is the desktop-first clickable app shell.
- `docs/design/prij-mobile-ui-lab.html` is phone-first and optimized for 390px browsing.
- `scripts/export-ui-theme-html.mjs` regenerates both files from the same section definitions.

Both HTML files open by double-clicking, work offline, use inline CSS, use inline JavaScript, and make no external API or CDN calls.

## Export

```powershell
npm run design:export-html
```

## Open

```powershell
npm run design:open-html
npm run design:open-mobile-html
```

You can also double-click either HTML file in `docs/design`.

## Included Sections

- Login
- Dashboard
- Patients
- New Patient
- Patient Workspace
- Calendar
- Queue
- Doctor Visit
- Orders / Investigations
- Prescriptions
- Billing
- Guidelines
- Protocol Atlas
- Admin Accounts
- Official Medication Import
- Settings / Themes

The sidebar and mobile drawer are clickable. Each item switches the visible section in the same HTML file without an API.

## Themes

- Prij Heritage
- Clinic Premium
- Minimal Clean
- Compact Operations
- Dark Navy
- Mobile Focus

Use the viewport controls for Mobile 390px, Tablet 768px, and Desktop full previews.

## Safety Boundaries

The lab includes no real PHI, no secrets, no payment data, no medication rows, no medication dosing examples, and no real clinical instructions. AI and clinical areas are represented as draft-only placeholders requiring doctor approval.
