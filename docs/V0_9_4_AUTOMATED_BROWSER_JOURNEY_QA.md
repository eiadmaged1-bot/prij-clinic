# v0.9.4 Automated Browser Journey QA

Branch: `qa/v0.9.4-automated-browser-journey`

v0.9.4 adds automated real-browser QA only. It does not release v0.9.3, does not create a tag, does not add product features, and does not replace final manual browser QA when the owner returns.

## Scope

The sprint adds Playwright Chromium journeys for:

- Login and dashboard.
- Fake/demo patient creation and patient workspace tabs.
- Clinic workflow pages: calendar, appointments, queue, doctor, doctor visit, billing, finance, orders, investigations, reports, and consents.
- Medication and drug-market declutter checks.
- Role visibility checks for owner/admin, doctor, receptionist, accountant, and nurse when seeded demo users are available.

Owner/admin login is required. Missing non-owner seeded role users are annotated as skipped, but a role that logs in and can see forbidden owner/admin controls fails the browser QA.

## Local commands

```powershell
npm run test:v094:browser
npm run test:v094:browser:headed
npm run test:v094:browser:report
```

Full browser journeys require the local web app, API, PostgreSQL, migrations, and seeded demo data to be available. Reports and traces are written only to ignored `playwright-report/` and `test-results/` folders.

## CI

`.github/workflows/v094-browser-journey.yml` runs on:

- Pushes to `qa/v0.9.4-automated-browser-journey`.
- Pull requests targeting `hardening/v0.9.3-automated-qa-stabilization`.
- Manual dispatch.

The workflow uses Node.js 22, PostgreSQL 16 demo data, existing migrations, existing seeds, built API/web servers, the existing local app wait script, `npm run test:v093:ui-text`, and `npm run test:v094:browser`.

## Safety

- Local demo only.
- No real patient data.
- No real payment gateway.
- No external AI calls.
- No autonomous diagnosis or prescribing.
- Doctor approval remains mandatory.
- No stock/order/checkout purchasing behavior.
- No patient dosing instructions generated from medication market strength/form metadata.
- No release tag is created by this sprint.
