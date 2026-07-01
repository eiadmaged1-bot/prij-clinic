# v0.9.6 Local Demo Database Finalization

Branch: `data/v0.9.6-local-demo-db-finalization`

Base branch: `data/v0.9.5-clean-reference-data-account-authority`

This sprint finalized the local/demo database state for manual QA without resetting, dropping, or wiping the database.

## Cleanup Status

Local guarded cleanup was applied with:

```powershell
$env:APP_ENV="local"
npm run db:v095:clean:dry-run
npm run db:v095:clean:apply
```

Baseline dry run targeted 602 clearly demo/test/local patients and linked operational records. After apply, `npm run db:v095:audit` reported 0 patient-linked operational rows for patients, appointments, queue tickets, encounters, prescriptions, investigation orders/results, reports, pregnancies, ultrasounds, invoices, payments, documents, tasks, notes, referrals, consent instances, AI drafts/snapshots/memory, patient medications/allergies, and calculations.

## Preserved Data

- Users, roles, permissions, and `eyad`.
- Audit logs.
- Investigation catalog rows.
- Medication reference and drug-market tables when present.
- Service catalog/setup data.
- Clinical protocols, calculators, guideline metadata, consent templates, branch/department/provider setup.

## Verification Snapshot

- Before cleanup demo patient count: 602.
- After cleanup demo patient count: 0.
- Investigation catalog count: 63.
- Key investigations verified: CBC, Serum Beta-hCG, AMH, Pap Smear / Cervical Cytology, Pelvic Ultrasound, Transvaginal Ultrasound, Dating Scan, Anomaly Scan, Fetal Growth Scan, Doppler Ultrasound, Mammography.
- `eyad`: present, active, protected, Owner role, reserved System Owner authority preserved.
- Doctor, Receptionist, Nurse, and Accountant roles: present.
- Account creation support: source/UI supports requested roles; endpoint creation checks require the API to be running.
- Audit rows: preserved.
- Official medication rows: absent in this local DB. This is a warning, not a fake pass. The next step is restore/import official medication data from approved local exports or official owner-provided files.

## New Local Scripts

```powershell
npm run db:v096:report
npm run db:v096:finalize-local-demo
npm run db:v096:ready-check
```

`db:v096:report` is report-only by default and writes ignored local artifacts under `storage/local-db-finalization/`.

`db:v096:finalize-local-demo` wraps the guarded v0.9.5 cleanup apply. Apply mode requires a safe `APP_ENV` and a non-production-like `DATABASE_URL`.

`db:v096:ready-check` verifies local demo readiness and reports warnings for blocked endpoint checks or missing official medication rows.

## Limitations

- Manual browser QA is still required.
- API-backed account creation verification was not completed in this session because the API was not reachable during the script checks.
- No release tag was created.
- No real patient data, real payment gateway, external AI, stock/order/checkout behavior, patient dosing instructions, or fake official medication data were added.
