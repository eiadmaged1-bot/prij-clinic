# V0.10.4 Mobile-Stable Static HTML Lab

Branch: `ui/v0.10.4-mobile-stable-html-lab`.

Scope: design/export stability only. This sprint does not change clinical logic, backend services, authentication, real patient data, medication data, external AI, uploads, or release tags.

## Purpose

The static HTML theme lab is rebuilt as one mobile-first static shell for reliable desktop and phone review. It works without Docker, database, API, login, or environment variables.

Default section: Dashboard.

## Generated Files

```text
ui-export/index.html
ui-export/assets/styles.css
ui-export/assets/app.js
ui-export/DESIGN_HANDOFF.md
ui-export/MOBILE_TESTING_GUIDE.md
ui-export/THEME_TOKENS.md
ui-export/UI_REVIEW_CHECKLIST.md
docs/design/prij-ui-theme-lab.html
docs/design/prij-mobile-ui-lab.html
```

The `docs/design` HTML files are compatibility copies. The designer handoff folder is `ui-export`.

## Commands

```powershell
npm run design:export-html
npm run design:serve-html
npm run design:test-mobile-html
npm run design:package-html
```

The static server serves only `ui-export` and prints localhost plus LAN URLs for phone testing on the same Wi-Fi.

## Included Sections

- Dashboard
- Login Preview
- Patients
- Patient File
- Doctor Workspace
- Calendar
- Queue
- Prescriptions
- Investigations
- Billing
- Admin
- Drug Market
- Guidelines
- Protocol Atlas
- Theme Gallery

## Mobile Stability

- Phone opens directly to Dashboard.
- Sidebar becomes a fixed drawer at tablet/phone widths.
- Menu opens the drawer, overlay closes it, and nav taps close it.
- Section navigation uses local state/hash and does not reload the page.
- Tables use horizontal wrappers on desktop and mobile cards on phones.
- Touch targets are at least 44px.
- CSS uses `100dvh` with `100vh` fallback and prevents horizontal body overflow.

## Themes

- Clinic Premium
- Prij Heritage
- Medicolize Portal
- Incision Portal
- Minimal Clean
- Compact Operations
- Dark Navy

Theme switching is local-only, immediate, and persisted in `localStorage`.

## Safety Notes

No real patient data, real passwords, `.env` values, secrets, API calls, uploads, backend data dumps, medication rows, preset patient medication instructions, commerce workflows, or external AI are included. Clinical content remains draft-only and doctor-reviewed.
