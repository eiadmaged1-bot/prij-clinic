# Data Hygiene and Local Reset

Prij Clinic local development must not use real patient data. Seed and reset workflows are split between reference/setup data and patient workflow data.

## Seed modes

- `PRIJ_SEED_MODE=clean`: default unless `SEED_DEMO_DATA=true`. Bootstraps system owner, RBAC, branches, settings, guideline sources, medication taxonomy/source registries, drug-market countries/sources/connectors, and Protocol Atlas.
- `PRIJ_SEED_MODE=test`: allows local test fixtures.
- `PRIJ_SEED_MODE=demo`: allows demo fixtures when not production.

Clean mode must not create fake patients, appointments, queue tickets, encounters, prescriptions, investigations, reports, pregnancies, ultrasound records, invoices, payments, consents, patient medications/allergies, medication safety checks/alerts, AI drafts, or patient clinical memories.

## Local reset

Run:

```powershell
npm run db:reset:clinic-data -- --dry-run
npm run db:reset:clinic-data
```

The reset script refuses production-like environments and does not drop schemas, truncate all tables, reset migrations, or delete audit logs.

Preserved by default: users, roles, permissions, branches, system settings, audit logs, guideline sources, Protocol Atlas, medication reference data, and drug-market reference data.
