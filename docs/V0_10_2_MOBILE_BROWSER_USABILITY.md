# V0.10.2 Mobile Browser Usability

Branch: `ui/v0.10.2-mobile-browser-usability`.

Scope: UI/usability and LAN phone QA only. No medication data, fake official medication rows, external AI, real patient data, payment gateway, RBAC weakening, audit weakening, or release tag.

## Implemented

- Desktop keeps the sidebar.
- Phone and tablet widths use a sticky topbar menu button and slide-out navigation drawer.
- The drawer closes after route selection.
- Main layout, cards, forms, tabs, and action strips have safer `min-width: 0`, `max-width: 100%`, and wrapping rules.
- Patient workspace tabs remain horizontal-scrollable and readable on phone.
- Existing table-like views use cards or safe scroll/card layouts.
- Forms collapse to one column on phone with full-width controls and finger-friendly button heights.
- LAN browser API resolution is documented and existing helper behavior is preserved.
- Development CORS continues to allow local/private LAN web origins only outside production.
- Mobile Playwright QA was added under `tests/v102`.

## Verification Targets

```powershell
npm run test:v102:mobile
```

The test suite checks mobile login, dashboard, patients, patient create, admin accounts, admin drug-market import status, guideline/protocol pages, patient workspace tabs, no horizontal overflow, no code-like text, and receptionist role visibility when the seeded account exists.

## Medication Status

Official medication rows remain absent locally until authorized official files are imported. Medication selection must stay honestly blocked while official rows are 0.
