# Data Hygiene and Reference Data Policy

This policy defines what v0.9.5 data hygiene scripts may report or clean in local/demo databases. It is not a production retention policy.

## A. Must Preserve Reference Data

- Users, roles, and permissions required for authentication and RBAC.
- The protected `eyad` System Owner account and reserved owner permissions.
- Medication families, ingredients, products, label sections, interactions, herbal references, and medication safety reference rules.
- Drug-market countries, sources, products, variants, availability, source connectors, merge candidates, review queues, row errors, source snapshots, import jobs, and import runs.
- Official medication import logs/status, source metadata, verification statuses, and official row provenance.
- Investigation catalog/reference names.
- Service catalog rows used as local setup/reference data.
- Clinical protocols and protocol atlas records.
- Calculator formulas and deterministic formula registry data.
- Guideline source registry, guideline metadata, and local evidence-library reference metadata.
- Consent templates when used as setup/reference templates.
- Branch, room, provider, department, and external provider setup unless explicitly marked demo-only.

## B. Safe To Clean As Operational Demo Data

Only local/demo/test operational records that are clearly identified as demo data may be removed by guarded scripts:

- Demo patients.
- Demo appointments and queue tickets.
- Demo encounters.
- Demo prescriptions and prescription items.
- Demo investigation orders/results linked to demo patients.
- Demo reports.
- Demo pregnancies, pregnancy details, antenatal visits, dating assessments, calculations, and ultrasounds linked to demo patients.
- Demo invoices, invoice items, payments, and refunds/reversals linked to demo patients.
- Demo patient documents, internal notes, tasks, and referrals.
- AI drafts, AI management snapshots, and clinical memory linked to demo patients.
- Consent instances linked to demo patients.
- Patient medication and allergy operational rows linked to demo patients.

Demo/test targeting requires explicit indicators such as `QA`, `Demo`, `Test`, `BrowserTest`, `V093`, `V094`, or `Local` prefixes in MRN/name-like fields, or links to such demo patients. The cleanup script must not infer that all operational records are disposable.

## C. Never Hard-Delete Without Explicit Production Policy

- Signed clinical records in real environments.
- Audit logs.
- Official medication reference data.
- Real patient records.
- Real PHI files or storage artifacts.
- Real payment records.
- Database migrations.

## Safety Rules

Run audit and cleanup commands only against local/dev/test/CI databases. Use dry run first:

```powershell
npm run db:v095:audit
npm run db:v095:clean:dry-run
```

Apply mode is guarded and must never run in production:

```powershell
APP_ENV=local npm run db:v095:clean:apply
```

Medication data remains market/reference metadata only. Market strength, form, and pack data must never become patient dosing instructions. Doctor review remains mandatory for clinical output.
