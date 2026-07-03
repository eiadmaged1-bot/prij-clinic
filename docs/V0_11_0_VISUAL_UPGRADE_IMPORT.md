# V0.11.0 Visual Upgrade Import

Branch: `ui/v0.11.0-visual-upgrade-import`

Source ZIP inspected: `incoming/visual-upgrade/prij-clinic-visual-upgrade-v0_11.zip`

Extraction path used for inspection only: `.tmp/visual-upgrade-v0.11/`

## Scope

This sprint imports the visual design direction from the static ZIP into the existing Prij Clinic HTML theme lab generator. The ZIP is a design reference only.

No backend code, database schema, clinical logic, CORS/security hardening, image sanitizer behavior, storage policy, authentication, API calls, or medication reference data were changed.

## Imported

- Deep navy, forest teal, and mint visual palette.
- v0.11 card, panel, notice, badge, metric-card, and button treatment.
- Grouped sidebar labels for workspace, patients, operations, knowledge, and preview areas.
- More premium typography scale and spacing rhythm.
- Mobile top bar styling from the visual reference.
- Patient file tab-strip visual affordance.
- Doctor workspace SOAP tab visual affordance.
- Theme-token documentation in the generated `ui-export/THEME_TOKENS.md`.

## Not Imported

- Raw ZIP app replacement HTML.
- Separate-only mobile drawer page behavior.
- Backend authentication.
- API calls or endpoint dependencies.
- Real patient data.
- Medication dosing instructions.
- AI diagnosis or AI prescribing behavior.
- Cart, checkout, buy, stock, or commerce workflow behavior.
- Generated ZIPs or preview screenshots.

## Safety Scan

The source ZIP was scanned for secrets, `.env` content, database/JWT tokens, API calls, localhost API references, external scripts, dangerous inline JS markers, real-looking patient/contact data, commerce wording, AI diagnosis/prescribing wording, and dosing instructions.

Result: no blocking unsafe content was found. Matches were limited to negative safety wording and design-rule documentation such as `No AI diagnosis`, `No AI prescribing`, and `No real patient data`.

Generated lab safety check:

```powershell
npm run design:v110:safety-check
```

The scanner checks generated HTML/CSS/JS under `ui-export` and the compatibility HTML files under `docs/design`.

## Mobile Behavior Preserved

- Dashboard opens first.
- No login gate is added.
- Static navigation remains local and hash-based.
- Phone and tablet widths keep the existing working slide-out drawer.
- Overlay close and nav-tap close behavior remain intact.
- Theme switching remains local-only and persisted in `localStorage`.
- Patient workspace tabs remain touch-friendly.
- Prescriptions remain safety-only and doctor-controlled.
- Drug Market remains a non-commerce reference-status area.

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

## Regenerate

```powershell
npm run design:export-html
npm run design:v110:safety-check
```

## Phone Test

```powershell
npm run design:serve-html
```

Open the printed LAN URL on a phone connected to the same Wi-Fi. Verify Dashboard-first loading, no login block, hamburger drawer behavior, sidebar navigation, patient file tabs, doctor workspace SOAP tabs, prescription safety wording, Drug Market non-commerce behavior, no horizontal scroll, and theme switching.
