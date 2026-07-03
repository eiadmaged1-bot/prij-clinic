# Next Steps

v0.11.1 appearance menu tab next steps:

1. Run the sprint verification sequence:

```powershell
git diff --check
npm run design:export-html
npm run design:v110:safety-check
npm run design:test-mobile-html
npm run test:v093:ui-text
npm run typecheck
npm run build
```

2. Start the static server:

```powershell
npm run design:serve-html
```

3. Open the printed LAN URL on a phone connected to the same Wi-Fi and verify Dashboard-first loading, no inline theme buttons above Dashboard or Prescriptions, compact Menu behavior, Appearance in the Menu drawer, drawer close after selecting Appearance, theme switching persistence, active theme marking, and no horizontal scroll.
4. Do not commit `.env`, storage, uploads, logs, backups, local DB files, screenshots, generated zips, `test-results`, `playwright-report`, incoming raw files, or `continue-clean-reference-theme-sprint.prompt.txt`.
5. Do not create a release tag from this sprint.

v0.11.0 visual upgrade import next steps:

1. Regenerate the static handoff:

```powershell
npm run design:export-html
```

2. Run the visual-import safety scan:

```powershell
npm run design:v110:safety-check
```

3. Run mobile static QA:

```powershell
npm run design:test-mobile-html
```

4. Start the local static server:

```powershell
npm run design:serve-html
```

5. Open the printed LAN URL on a phone connected to the same Wi-Fi and verify Dashboard-first loading, no login gate, hamburger drawer behavior, sidebar navigation, patient file tabs, doctor workspace SOAP tabs, prescription safety-only wording, Drug Market non-commerce behavior, no horizontal scroll, and theme switching.
6. Do not commit the source ZIP, `.tmp`, generated ZIPs, screenshots, `.env`, storage, uploads, logs, backups, DB files, `test-results`, or `playwright-report`.
7. Do not create a release tag from this sprint.

v0.10.4 mobile-stable static HTML lab next steps:

1. Regenerate the static handoff:

```powershell
npm run design:export-html
```

2. Start the local static server:

```powershell
npm run design:serve-html
```

3. Open `http://localhost:4174` on desktop, or open the printed LAN URL on a phone connected to the same Wi-Fi.
4. Run automated mobile static checks:

```powershell
npm run design:test-mobile-html
```

5. Package the designer handoff only after review:

```powershell
npm run design:package-html
```

6. Do not commit the generated zip under `storage/ui-export/`. Do not add real patient data, medication data, uploads, API calls, secrets, external AI, or release tags.

v0.10.2 mobile browser usability next steps:

1. Start local dev:

```powershell
npm run dev
```

2. Run automated mobile QA:

```powershell
npm run test:v102:mobile
```

3. Perform manual phone QA from `docs/MANUAL_QA_MOBILE_CHECKLIST.md` on iPhone Safari and Android Chrome over LAN.
4. Use `docs/MOBILE_LAN_TESTING.md` to open `http://PC_IP:3000` and verify `http://PC_IP:3001/health`.
5. Keep official medication selection blocked while official rows remain 0. Do not create fake medication rows or a release tag.

v0.10.1 official medication import operator next steps:

1. Obtain authorized official medication registry/source files from the owner/admin.
2. Place the files in `storage/official-medication-sources/`.
3. Scan the inbox:

```powershell
npm run medication:v101:operator -- -Scan
```

4. Dry-run a selected file:

```powershell
npm run medication:v101:operator -- -DryRun -Source NHRA -Country BH -File "PATH"
```

5. Apply only after source and mapping review:

```powershell
$env:APP_ENV="local"
npm run medication:v101:operator -- -Apply -ConfirmApply -Source NHRA -Country BH -File "PATH"
```

6. Verify:

```powershell
npm run medication:v097:ready-check:strict
npm run prescriptions:v097:medication-selection-check
```

7. If official rows remain 0, keep prescription medication selection blocked and document the warning honestly.
8. Do not create fake rows, dose automation, stock/order/checkout imports, or a release tag.

v0.10.0 official medication re-import next steps:

1. Obtain Bahrain NHRA and Oman MOH official/public files or owner-approved official files.
2. Place them only through the guarded acquisition helper:

```powershell
npm run medication:v100:source-acquire -- --file PATH --source NHRA --country BH --apply
npm run medication:v100:source-acquire -- --file PATH --source OMAN_MOH --country OM --apply
```

3. Dry-run each import before apply:

```powershell
npm run medication:v100:reimport:dry-run -- --source NHRA --country BH --file PATH
npm run medication:v100:reimport:dry-run -- --source OMAN_MOH --country OM --file PATH
```

4. Apply only after source and mapping review:

```powershell
$env:APP_ENV="local"
npm run medication:v100:reimport:apply -- --source NHRA --country BH --file PATH
```

5. Run `npm run medication:v097:ready-check` after any apply. Run strict readiness and prescription medication selection checks only if official rows exist.
6. Do not create fake rows, scrape retail/stock/order/checkout pages, mark unverified rows verified, or create a release tag.

v0.9.9 medication provenance recovery next steps:

1. Keep `storage/medication-provenance-recovery/` ignored and do not commit recovered exports or reports.
2. If the owner locates an old ignored export, DB dump, or old Postgres container, validate/export through:

```powershell
npm run medication:v099:provenance
npm run medication:v099:export-from-recovery-db -- -ContainerName OLD_RECOVERY_CONTAINER -User DB_USER -Database DB_NAME
npm run medication:v098:validate-candidate -- --file "storage/medication-provenance-recovery/official-medication-recovered.jsonl"
npm run medication:v099:import-recovered:dry-run
```

3. Apply import only in local/dev/test/CI after the dry run is clean:

```powershell
$env:APP_ENV="local"
npm run medication:v099:import-recovered:apply
```

4. Do not claim strict medication readiness unless official rows exist and strict checks pass.
5. Do not create a release tag from this sprint.

v0.9.7 reference data readiness next steps:

1. Run `npm run db:v097:prepare-reference`.
2. If an approved previous official medication export is found, apply restore with `APP_ENV=local npm run medication:v097:restore:apply`.
3. Run `npm run medication:v097:ready-check:strict` after restore.
4. Run `npm run guidelines:v097:ready-check`, `npm run accounts:v097:role-ready-check`, and, when medication rows exist, `npm run prescriptions:v097:medication-selection-check`.
5. Start manual browser QA only after readiness checks pass or warnings are accepted as known blockers.
6. Do not create a release tag from this sprint.

v0.9.6 local demo database finalization next steps:

1. Start the local API and web app against the cleaned local database.
2. Rerun endpoint-backed account verification with the API reachable:

```powershell
npm run db:v095:verify-reference
npm run db:v096:ready-check
```

3. Manually QA `/admin/accounts` as `eyad` for Doctor, Receptionist, Nurse, and Accountant demo account creation and login.
4. Manually QA `/orders` and `/investigations` to confirm seeded investigation catalog names are visible for order selection.
5. Restore/import official medication rows from approved local exports or owner-provided official files if this local DB needs full medication-reference QA. Do not create fake official rows.
6. Keep generated reports in ignored `storage/local-db-finalization/`; do not commit them.
7. Do not create a release tag from this sprint.

v0.9.5 data hygiene/reference next steps:

1. Let GitHub Actions run `v0.9.5 Data Hygiene Reference Gate` on `data/v0.9.5-clean-reference-data-account-authority`.
2. When Docker/PostgreSQL are available locally, run:

```powershell
docker compose up -d postgres
npm run prisma:repair
npm run prisma:seed
npm run db:v095:audit
npm run db:v095:clean:dry-run
npm run db:v095:verify-reference
```

3. Review the dry-run output before any apply cleanup.
4. Apply cleanup only in local/dev/test/CI demo databases:

```powershell
APP_ENV=local npm run db:v095:clean:apply
```

5. Manually QA `eyad` account creation for Doctor, Receptionist, Nurse, and Accountant test accounts from `/admin/accounts`.
6. Do not tag v0.9.3, v0.9.4, or v0.9.5 from this sprint.

v0.9.4 automated browser journey QA next steps:

1. Let GitHub Actions run `v0.9.4 Browser Journey QA` on `qa/v0.9.4-automated-browser-journey`.
2. When Docker/PostgreSQL are available locally, start the demo stack and run `npm run test:v094:browser`.
3. Review the Playwright report with `npm run test:v094:browser:report` if failures occur.
4. Use the browser QA output to shorten, not replace, final owner manual QA.
5. Do not tag v0.9.3 or v0.9.4 until final local validation and manual browser QA pass.

v0.9.3 release-candidate finalization steps:

1. Return home and start Docker Desktop.
2. Run `npm run dev:diagnose`.
3. Run `npm run test:v093:release`.
4. Run the manual browser QA checklist in `docs/V0_9_3_MANUAL_BROWSER_QA_CHECKLIST.md`.
5. Run the guarded release command only after all checks pass:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/v093-release-commands.ps1 -RequireAllChecksPassed
```

6. Push the release tag only after local validation and manual QA pass.

Release controls:
- CI Release Gate passed, and normal CI passed.
- v0.9.3 is a release candidate, not a final release.
- Do not create or push a tag from CI status alone.
- Do not use `V093_ALLOW_ENV_SKIP=1` to claim release validation.
- Do not use real patient data, real payment gateway, external AI, autonomous prescribing, or market strength/form as patient dosing.

Optional local helper:

```powershell
npm run qa:v093:checklist
```

Medication data next steps:
- Continue Oman manual review and consider a future verification batch from remaining strict high-confidence rows.
- Continue Bahrain manual review beyond the 600 verified rows.
- Recover Qatar/Kuwait/SFDA only through official public files or owner-provided official uploads.
- Keep Egypt limited to official file upload and targeted lookup.
- Add UAE/Saudi/Egypt official file intake when owner-provided files are available.
- Periodically run `npm run medication:official-data:export`, verify the ignored local export, and run the isolated restore drill.

Engineering next steps:
- Run manual browser QA for `/login`, `/dashboard`, `/patients`, `/patients/new`, a patient file, `/calendar`, `/queue`, `/doctor`, `/billing`, `/admin`, `/orders`, `/medications`, and `/drug-market`.
- Run Prij Heritage manual QA across shell, dashboard, patient file, doctor workflow, reception queue, calendar, finance, medications, drug-market product profiles, and owner/admin medication review.
- Run role-based manual browser QA for owner/admin, doctor, receptionist, accountant, and nurse navigation visibility after automated API role checks pass.
- Consider backend persistence improvements for theme defaults only if owner appearance requirements outgrow the current lightweight system.
- Add richer appointment and queue status controls once backend status transitions are wired into the visible pages.
- Add duplicate-patient warning logic behind the patient creation form.
- Add service catalog editing as its own owner page if the current Owner Control Center becomes too dense.
- Expand review queue UI with import-run selector backed by actual import run list.
- Add richer protected admin drawer for original official fields without exposing raw technical output in normal UI.
