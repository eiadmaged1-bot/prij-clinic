# Next Steps

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
