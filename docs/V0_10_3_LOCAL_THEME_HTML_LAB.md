# V0.10.3 Local HTML UI Theme Lab

Branch: `ui/v0.10.3-local-theme-html-lab`.

Scope: UI/design export only. No clinical logic, medication data, database records, API integration, external AI, RBAC changes, audit changes, or release tag.

## Purpose

The sprint creates standalone local HTML files so the owner can open Prij Clinic UI states directly in a browser and tune the design visually without running the API or Next.js app.

## Generated Files

```text
docs/design/prij-ui-theme-lab.html
docs/design/prij-mobile-ui-lab.html
```

Both files are self-contained with inline CSS and inline JavaScript for theme switching, drawer mock behavior, and viewport preview controls.

## Commands

```powershell
npm run design:export-html
npm run design:open-html
npm run design:open-mobile-html
```

## Included UI States

- Login screen
- Dashboard shell
- Desktop sidebar
- Mobile topbar and drawer mock
- Patient list
- New patient form
- Patient workspace
- Scrollable patient tabs
- Orders and investigations panel
- Guideline and protocol browser card
- Admin accounts card
- Official medication import status card
- Empty states, buttons, badges, alerts, tables, mobile cards, and forms

## Themes

- Prij Heritage
- Clinic Premium
- Minimal Clean
- Compact Operations
- Dark Navy
- Mobile Focus

## Mobile Checks

The lab is designed for no horizontal body overflow from 360px phone width through desktop. On small screens, cards stack, forms collapse to one column, tabs scroll horizontally, buttons remain finger-friendly, and table examples convert to card-list replacements.

## Copy-Back Path

Approved visual changes should be copied back deliberately:

1. Move token changes into `apps/web/app/globals.css`.
2. Move shell or drawer changes into `apps/web/app/mvp-page.tsx`.
3. Move page-specific layout changes into the matching Next.js page or component.
4. Re-run typecheck, build, and relevant UI/mobile tests.

The HTML lab is not the production app and must not become a source of clinical logic.

## Safety Notes

The export uses neutral labels only, including `Patient file`, `New patient`, `No patient selected`, `Official medication rows: 0`, `Medication selection blocked until official rows exist`, `Guideline library ready`, `Doctor approval required`, and `Reference metadata only`.

It includes no API calls, no real PHI, no fake database data, no medication dosing instructions, no external assets, and no external scripts.
