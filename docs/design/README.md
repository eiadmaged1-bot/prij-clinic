# Prij Clinic Local HTML Design Lab

The design lab exports static, standalone HTML previews of the current Prij Clinic UI direction. The files are for visual design iteration only and are not the production app.

## Files

- `docs/design/prij-ui-theme-lab.html` covers the desktop shell, mobile drawer mock, login, patient list, forms, patient workspace, orders, guidelines, admin cards, medication import status, alerts, tables, badges, and empty states.
- `docs/design/prij-mobile-ui-lab.html` is phone-first and optimized around a 390px viewport.
- `scripts/export-ui-theme-html.mjs` regenerates both files.

## Export

```powershell
npm run design:export-html
```

The generator does not call the API, does not require Next.js, and does not create screenshots.

## Open

```powershell
npm run design:open-html
npm run design:open-mobile-html
```

You can also double-click either HTML file in `docs/design`.

## Edit And Compare

Use the theme switcher to compare:

- Prij Heritage
- Clinic Premium
- Minimal Clean
- Compact Operations
- Dark Navy
- Mobile Focus

Use the viewport buttons for Mobile 390px, Tablet 768px, and Desktop full previews. Local CSS edits can be made directly in the HTML for visual experiments, then approved values should be copied back into the real app tokens in `apps/web/app/globals.css` and matching component structure in `apps/web/app/mvp-page.tsx` or focused page components.

## Safety Boundaries

The lab is offline static HTML. It includes no real data, no fake database records, no medication rows, no medication dosing instructions, no secrets, no API calls, and no clinical decision automation. Clinical output remains draft-only until reviewed and approved by a doctor.
