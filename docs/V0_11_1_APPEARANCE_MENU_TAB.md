# v0.11.1 Appearance Menu Tab

Branch: `ui/v0.11.1-appearance-menu-tab`

## Scope

- Moved the static UI theme selector out of the main clinical content shell.
- Added `Appearance` as a static navigation section.
- Kept Dashboard-first loading and the existing no-login static UI lab behavior.
- Preserved local theme switching and localStorage persistence.
- Added active-theme marking for the selected Appearance button.
- Improved mobile behavior by keeping theme controls out of the initial Dashboard and clinical screens.

## Safety

- No backend code changes.
- No database, schema, security, CORS, or image sanitizer changes.
- No API calls, real auth, real patient data, medication dosing, AI diagnosis, AI prescribing, commerce wording, release tag, or clinical logic changes.
- Appearance changes the visual preview only.

## Verification

Checks run:

```powershell
git diff --check                         # PASS, line-ending warnings only
npm run design:export-html               # PASS
npm run design:v110:safety-check         # PASS
npm run design:test-mobile-html          # PASS, 6 mobile viewport tests
npm run test:v093:ui-text                # PASS
npm run typecheck                        # FAIL, existing API Prisma type issues
npm run build                            # FAIL, same API Prisma type issues; web build passed
```

Typecheck/build blocker is outside this UI-only sprint:

- `apps/api/src/encounters/encounters.service.ts`: encounter create data is missing required `branchId`.
- `apps/api/src/patients/patients.service.ts`: queue ticket create data is missing required `queueDate`, and encounter create data is missing required `branchId`.
- `apps/api/src/queue/queue.service.ts`: queue ticket create data is missing required `queueDate`.

Manual phone check remains:

```powershell
npm run design:serve-html
```

Verify Dashboard opens first, theme buttons are not above Dashboard or Prescriptions content, Menu opens, Appearance exists in Menu, Appearance opens the selector, theme switching works, drawer closes after selecting Appearance, and there is no horizontal scroll.
