# V0.7 Medication Intelligence Source-of-Truth Audit

Sprint: v0.7 Medication Intelligence Source-of-Truth Audit

Branch: `audit/v0.7-medication-intelligence-source-of-truth`

Base branch: `integration/v0.7-medication-intelligence-unified`

## Scope

This audit stabilizes the integrated Medication Intelligence Engine v2 framework before any real Egypt/GCC medicine data import. It is not a new feature sprint and does not import real medicine files.

Medication Intelligence Engine v2 remains doctor-support only:

- No autonomous prescribing.
- No automatic diagnosis.
- No automatic medication dose changes.
- No automatic prescription signing.
- Doctor approval remains mandatory.
- Strength, form, route, and package fields are market metadata only, never patient dosing instructions.
- Major and critical alerts remain visible until reviewed or overridden with a reason.
- Retail metadata connectors remain disabled by default.
- Official registry/source data has priority over retail metadata.

## Prisma Audit

Result: passed.

The Prisma schema contains one model definition for each requested medication and drug-market model:

- `DrugFamily`
- `MedicationIngredient`
- `MedicationFamilyMembership`
- `MedicationProduct`
- `MedicationLabelSection`
- `MedicationInteractionRule`
- `HerbalProduct`
- `PatientAllergy`
- `PatientMedication`
- `MedicationSafetyCheck`
- `MedicationSafetyAlert`
- `MedicationDataSource`
- `MedicationDataImportJob`
- `DrugMarketCountry`
- `DrugMarketSource`
- `DrugMarketProduct`
- `DrugMarketVariant`
- `DrugMarketAvailability`
- `DrugMarketImportJob`
- `DrugMarketImportRowError`
- `DrugMarketManualReviewQueue`
- `DrugMarketSearchLog`
- `DrugMarketImportRun`
- `DrugMarketSourceConnector`
- `DrugMarketMergeCandidate`

Search-critical fields have indexes where implemented, including normalized medication search text, family/product names, generic/trade names, country code, strength/form, registration number, source status, import status, and review status.

No duplicate model names or broken Prisma relations were found by `npm run prisma:repair` and `npm run prisma:seed`.

## Seed And Source Audit

Result: passed with demo-data limitation.

Seed data includes:

- Medication taxonomy foundations for ACE inhibitor, beta blocker, NSAID, antibiotic, cephalosporin, macrolide, gram-positive, gram-negative, vitamin, and iron style lookup coverage where implemented.
- Country records for `EG`, `KSA`, `UAE`, `QAT`, `KWT`, `BHR`, `OMN`, and optional `YEM`.
- Egypt compact badge hidden by default; non-Egypt target-country badges visible.
- Official-source placeholders for EDA/EDDB, SFDA, UAE EDE/MOHAP, Qatar MOPH, Kuwait MOH, Bahrain NHRA, Oman official upload, and Yemen optional official upload.
- Disabled connector placeholders for official-source-first automation.
- A disabled retail public metadata connector template.
- Demo market products clearly named as demo/reference data.

No patient dosing instructions or controlled-drug use instructions are seeded as medication intelligence data.

## RBAC And Endpoint Audit

Result: passed.

Backend route guards protect medication and drug-market APIs with explicit permissions. Verified behavior includes:

- Receptionist and accountant are denied medication safety checks.
- Receptionist and accountant are denied drug-market import/admin tools.
- Non-admin users cannot import market rows.
- Doctors can search medications and run medication safety checks when seeded permissions allow it.
- Admin/Owner can manage catalog/source/import/verification workflows.
- Alert override requires a doctor/admin/owner style permission and a reason.
- Direct API access is denied by server-side RBAC, not only hidden in UI.

Audited actions include medication catalog create/update, safety check, alert review, alert override with reason, patient medication add/update/stop, patient allergy add/update, drug-market source create/update, country update, variant update/verify/retire, import completion/failure, connector dry-run/run, review queue actions, and merge candidate actions.

## UI Audit

Result: passed with one stabilization fix.

The audit added the missing `/admin/drug-market/coverage` page using the existing coverage dashboard component and admin-only navigation.

Medication and drug-market UI avoids raw JSON, endpoint paths, stack traces, and normal-user Prisma/schema/database wording in tested pages. Medication result cards show generic name, brand/trade name, drug family, and strength/form metadata. Drug-market cards show trade name, generic name, variants, country badges, and review status.

Patient workspace medication, allergy, herbal/supplement, medication safety, and prescription safety tabs remain role-aware and focused. Prescription integration remains doctor-authored; medication market fields are reference metadata only.

## Importer And Source Policy Audit

Result: passed with stabilization fixes.

Source policy blocks:

- Login-required sources.
- CAPTCHA or protected sources.
- Paywall sources.
- Checkout, cart, order, stock, branch, and payment URLs.
- Unapproved source policies.
- Disabled retail metadata connectors.

The audit hardened URL keyword checks for paywall/protected paths and expanded the connector registry constant to match seeded target-country official connectors.

Imported rows default to `needs_review`/`imported` style states. Variant idempotency uses `countryCode` plus `sourceRowHash`. Retail metadata remains disabled by default. No raw imported files, PDFs, uploads, storage files, screenshots, or secrets were intentionally staged.

## Country List

Target country result: passed.

- `EG`
- `KSA`
- `UAE`
- `QAT`
- `KWT`
- `BHR`
- `OMN`
- optional `YEM`

## Staging Smoke

Result: gated.

Command run:

```powershell
$env:APP_ENV="staging"; npm run test:staging:smoke; Remove-Item Env:APP_ENV -ErrorAction SilentlyContinue
```

Exact gate:

```text
FAIL staging smoke test: AI must remain disabled for staging smoke tests.
```

Reason: no `.env.staging` exists in this workspace and no shell staging variables are set. The script requires `AI_PROVIDER=disabled` before it continues to the demo staging password checks.

## Verification

Baseline verification completed before edits:

- `git status --short`: clean.
- `git branch --show-current`: `audit/v0.7-medication-intelligence-source-of-truth`.
- `git diff --check`: passed.
- `npm run dev:stop`: passed.
- `docker compose up -d postgres`: passed.
- `npm run prisma:repair`: passed.
- `npm run prisma:seed`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.

Test results before documentation:

- `npm run test:security:ci`: pass, 25 pass, 2 warnings, 0 fail.
- `npm run test:security:expanded`: pass, expanded summary 6 pass, 0 fail; route/audit/security warnings documented by script.
- `npm run test:theme:ui`: first run failed because web port 3000 was not running; rerun after starting web passed, 10 pass, 0 warning, 0 fail.
- `npm run test:doctor:ux`: pass, 12 pass, 0 warning, 0 fail.
- `npm run test:visual:qa`: pass, 8 pass, 0 warning, 0 fail.
- `npm run test:e2e:v01`: pass, 17 pass, 1 warning, 0 fail.
- `npm run test:clinical:persistence`: pass, 17 pass, 0 warning, 0 fail.
- `npm run test:obgyn:core`: pass, 10 pass, 0 warning, 0 fail.
- `npm run test:accounts:rbac`: pass, 18 pass, 0 warning, 0 fail.
- `npm run test:ai:regression`: pass, 10 pass, 1 warning, 0 fail.
- `npm run test:medications`: pass, 14 pass, 0 warning, 0 fail.
- `npm run test:drug-market`: pass, 14 pass, 0 warning, 0 fail.
- `npm run test:drug-market:auto-import`: pass, 14 pass, 0 warning, 0 fail.
- `npm run test:medication-intelligence`: pass, 14 pass, 0 warning, 0 fail.
- `npm run test:staging:smoke`: gated by missing disabled-AI staging env configuration.

Final verification after audit stabilization repeated the same core checks on the edited tree:

- Conflict marker grep: no matches.
- `git diff --check`: passed.
- `npm run dev:stop`: passed.
- `docker compose up -d postgres`: passed.
- `npm run prisma:repair`: passed.
- `npm run prisma:seed`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed and included `/admin/drug-market/coverage`.
- Full requested local test suite: passed, with the same script-reported warnings listed above.
- Staging smoke: still gated with `FAIL staging smoke test: AI must remain disabled for staging smoke tests.`

## Remaining Limitations

- Medication Intelligence Engine v2 is not a complete Egypt/GCC real medicine database.
- Real official-source import is still pending.
- Demo market data is demo/reference only.
- Interaction and herbal safety rules are seeded demo logic, not a commercial clinical medication database.
- No dosing database is integrated.
- No pharmacy stock, order, checkout, or purchase flow exists.
- No external AI calls are allowed or needed for this audit.
- Staging smoke remains gated until a real non-committed `.env.staging` or equivalent shell variables provide disabled AI config and staging demo credentials.

## Next Step

Next sprint: Official Medication Data Import Pack 1 - Egypt + Saudi Arabia.
