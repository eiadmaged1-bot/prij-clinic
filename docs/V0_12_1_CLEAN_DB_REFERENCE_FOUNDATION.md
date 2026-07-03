# v0.12.1 Clean Database + Real Reference Foundation

This sprint prepares a repeatable local/development baseline for useful clinic testing without fake operational clinic data.

## Commands

Inventory:

```powershell
npm run db:v121:inventory
```

Dry-run:

```powershell
npm run db:v121:baseline:dry-run
```

Apply only in a local/dev/test database:

```powershell
$env:APP_ENV="local"
npm run db:v121:baseline:apply
```

Verify:

```powershell
npm run db:v121:verify-clean
npm run db:v121:medications:ready
npm run test:v121:reference-baseline
```

## What Apply Does

`db:v121:baseline:apply` runs inventory, cleanup apply with `--all-operational-local`, investigation seed, operation seed, service seed, medication readiness, and clean-baseline verification.

Cleanup deletes patient-linked operational rows only: patients, appointments, queue tickets, encounters, prescriptions, investigation orders/results, reports, invoices/payments, tasks, referrals, patient documents, consent records linked to patients, pregnancy/gynecology workflow rows, AI drafts/snapshots, patient medications/allergies, calculations, and related safety-check rows.

Cleanup preserves users, roles, permissions, branches, audit logs, migrations, clinical protocols, guidelines, medication reference/import tables, drug-market reference/import rows, investigation catalog, service catalog, operation catalog, system settings, and theme settings.

## Reference Catalogs

Investigation catalog seeding extends the existing `InvestigationCatalogItem` model with OB/GYN laboratory, radiology, ultrasound, and pathology/cytology names. It seeds catalog names only and does not create results.

Operation catalog seeding adds `OperationCatalogItem` for patient surgical/procedure history dropdowns. It is not billing, has no price, and does not imply indication.

Service catalog seeding adds clinic service names with `price = null` and `reviewStatus = price_review_required`. It does not seed fake prices.

Medication readiness reports official/verified counts honestly. If official rows are zero, it reports a warning and does not create medication rows.

## API

Authenticated read-only endpoints:

- `GET /reference/investigations`
- `GET /reference/operations`
- `GET /reference/services`
- `GET /reference/medication-readiness`

These endpoints expose reference/catalog data only. They do not return PHI and do not write data.
