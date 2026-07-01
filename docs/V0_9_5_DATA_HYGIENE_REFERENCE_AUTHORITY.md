# v0.9.5 Data Hygiene + Reference Catalog + Eyad Account Authority

Branch: `data/v0.9.5-clean-reference-data-account-authority`

Base target: `qa/v0.9.4-automated-browser-journey`

v0.9.5 prepares local/demo databases for serious testing without resetting or dropping the database.

## What Is Preserved

- Protected `eyad` System Owner account.
- Users, roles, permissions, and account protection metadata.
- Audit logs.
- Medication families, ingredients, products, sources, import jobs, verification status, drug-market countries/sources/products/variants/availability, import runs, source snapshots, and official medication metadata.
- Investigation catalog/reference names.
- Service catalog/setup data.
- Clinical protocols, calculators, guideline source registry, consent templates, branch/department/provider setup.

## What Cleanup Targets

`npm run db:v095:clean:dry-run` reports only clearly demo/test/local operational rows:

- Demo patients with `QA`, `Demo`, `Test`, `BrowserTest`, `V093`, `V094`, or `Local` identifiers.
- Operational records linked to those demo patients: appointments, queue tickets, encounters, prescriptions, investigation orders/results, reports, pregnancies, ultrasounds, invoices/payments, documents, notes, tasks, referrals, consent instances, AI drafts/snapshots/memory, patient medications/allergies, and calculations.

Apply mode is guarded:

```powershell
APP_ENV=local npm run db:v095:clean:apply
```

It refuses production-like environments and production-like database URLs.

## Investigation Catalog

The sprint adds `InvestigationCatalogItem` as reference data only. Seeded names include general labs, infectious/antenatal screening, hormonal/fertility tests, OB/GYN ultrasound names, radiology/imaging names, ECG, and chest X-ray.

The catalog does not create patient investigation orders, results, diagnostic interpretation, or recommendations.

Run directly:

```powershell
npm run db:v095:seed-investigations
```

It is also included in `npm run prisma:seed`.

## Eyad Account Authority

The existing `/admin/accounts` API and UI are used and strengthened:

- `eyad` remains protected and active.
- `eyad` has Owner role plus reserved System Owner permission override.
- `/admin/accounts` supports creating local demo staff accounts for Doctor, Receptionist, Nurse, Accountant, and Admin roles.
- Passwords are hashed; plaintext passwords are not stored.
- Account creation, updates, password resets, activation/deactivation, permission changes, and protected denials remain guarded by RBAC and audit logging.
- Receptionist/accountant/doctor/nurse accounts cannot create accounts.
- `eyad` cannot be demoted, deactivated, deleted, or edited through normal account management flows.
- A `POST /admin/accounts/:id/reactivate` alias is available alongside the existing activation endpoint.

## Verification

```powershell
npm run db:v095:audit
npm run db:v095:clean:dry-run
npm run db:v095:verify-reference
```

When the API is running, the verifier logs in as `eyad`, creates local demo Doctor and Receptionist accounts, verifies they can log in, verifies Receptionist is denied account creation, and checks account creation audit rows.

When the API is unavailable, the verifier warns and performs DB/source fallback checks; that fallback is useful for blocked local machines but endpoint verification should still pass in CI or on a full local stack.

## CI

`.github/workflows/v095-data-hygiene-reference.yml` defines `v0.9.5 Data Hygiene Reference Gate`.

It uses a PostgreSQL 16 CI database, seeds demo/reference data, runs typecheck/build, starts API/web, audits data shape, runs dry-run cleanup, verifies reference/account authority, applies cleanup only in the throwaway CI database, re-verifies, runs UI text checks, and lists Playwright journeys.

No release tag is created.

## Safety

- No real patient data.
- No production credentials.
- No external AI.
- No autonomous prescribing.
- No medication dosing instructions from market metadata.
- No retail scraping, stock, order, checkout, or payment gateway behavior.
- Final manual QA is still required.
