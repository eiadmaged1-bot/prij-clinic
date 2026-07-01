# Next Steps

v0.9.9 official medication file intake next steps:

1. Owner places official medication file/export in `storage/official-medication-inbox/`.
2. Run:

```powershell
npm run medication:v099:inbox-scan
npm run medication:v099:inbox-validate
npm run medication:v099:intake-ready
```

3. If one file is `RESTORE_READY`, run `npm run medication:v099:restore-inbox:dry-run`.
4. Apply only after owner review in local/dev/test/CI:

```powershell
$env:APP_ENV="local"
npm run medication:v099:restore-inbox:apply
```

5. If files are `NEEDS_MAPPER`, plan a focused parser/mapping sprint before import.
6. Medication prescription selection remains blocked until official rows exist.
7. Do not create a release tag from this sprint.

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
