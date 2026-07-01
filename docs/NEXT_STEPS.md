# Next Steps

v0.9.3 automated QA next steps:
- Watch the GitHub Actions `v0.9.3 Release Gate` workflow on branch `hardening/v0.9.3-automated-qa-stabilization`; it should run the v0.9.3 QA against a CI PostgreSQL service without `V093_ALLOW_ENV_SKIP=1`.
- Treat any CI API/DB-backed failure as a real blocker. Do not convert CI to skip mode.
- Run `npm run dev:diagnose` on the Docker-available machine to confirm Docker daemon, PostgreSQL, ports 3000/3001/5432, API health, DB health, env-file presence, and Prisma client status.
- Start Docker Desktop locally, then run `npm run test:v093:release`.
- If running manually, use `docker compose up -d postgres`, `npm run prisma:repair`, `npm run prisma:seed`, `npm run dev`, then rerun `npm run test:v093:patient-create` and `npm run test:v093:roles`.
- Rerun the full requested existing test sweep after the API and DB are reachable if `npm run test:v093:release` cannot complete it automatically.
- Keep `npm run test:v093:routes`, `npm run test:v093:ui-text`, and `npm run test:v093:medication-ui` in the release-candidate gate.
- Do not create `v0.9.3-automated-qa-stabilization` until all API-backed checks pass without `V093_ALLOW_ENV_SKIP=1`.
- Do not create a release tag from CI alone; final local DB/API validation and manual browser QA remain required.

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
