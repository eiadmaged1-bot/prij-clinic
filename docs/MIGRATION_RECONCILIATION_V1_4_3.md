# Migration Reconciliation v1.4.3

## Preservation evidence

- Provider: PostgreSQL.
- Backup: `C:\Newfolder\prij-clinic\backups\prij-clinic-local-20260714-032357.backup.sql` (verified, 27,546,916 bytes).
- The database contains real operational data. Non-identifying affected counts before repair were: Patient 572, Appointment 199, Encounter 311, Prescription 194, Invoice 474, Payment 305, and AuditLog 38,492.
- No reset, volume deletion, migration rewrite, data deletion, or destructive test was used.

## Original drift and classification

`20260711120000_user_interface_preferences` failed with P3018 because `InterfaceMode` already existed while the ledger entry remained failed. Every statement was compared with PostgreSQL catalogs and the migration SQL. All three enums and ordered values, `UserPreference`, columns, PK/FK, unique/index state, nullability, and defaults existed except the `updatedAt` default. Classification: **B — partially applied**.

Five later production migrations were pending in metadata while their cumulative live structures were proven present: `20260711192800_add_auth_session_foundation`, `20260711200500_add_idempotency_record`, `20260712000000_part_e`, `20260712043000_patient_document_security`, and `20260712073722_part_h_performance_indexes`.

`GuidelineSource.abbreviation` was defined as nullable `String?`, with no default, uniqueness, or index, in the Prisma model and `20260629223000_guideline_center_foundation`. That migration was ledger-applied, but the live table's 248 rows had no such column or alternate-name column. A nullable forward add therefore required no content rewrite or backfill.

## Forward-only repair

New migration: `20260714040000_reconcile_database_drift`.

It transactionally and idempotently preflights uniqueness, adds only missing nullable guideline columns including `abbreviation`, restores proven missing UUID/timestamp defaults and indexes, preserves legacy query text through deterministic backfill, restores `UserPreference.updatedAt`, and removes one obsolete appointment index. It does not recreate existing enums or delete clinical/operational rows.

After applying its SQL, the supported resolution commands were run from `apps/api`:

```text
node scripts/prisma.cjs migrate resolve --applied 20260711120000_user_interface_preferences
node scripts/prisma.cjs migrate resolve --applied 20260711192800_add_auth_session_foundation
node scripts/prisma.cjs migrate resolve --applied 20260711200500_add_idempotency_record
node scripts/prisma.cjs migrate resolve --applied 20260712000000_part_e
node scripts/prisma.cjs migrate resolve --applied 20260712043000_patient_document_security
node scripts/prisma.cjs migrate resolve --applied 20260712073722_part_h_performance_indexes
node scripts/prisma.cjs migrate resolve --applied 20260714040000_reconcile_database_drift
```

Each resolution followed statement-level schema proof; no migration was marked applied merely to silence drift.

## Results

- Preserved database: 51 migrations current; no failed migration; empty schema diff; Prisma generation, repair, and seed passed.
- Protected-table counts and deterministic hashes were exactly unchanged before/after repair and seed.
- Preserved reference counts after seed: Permission 202, ClinicalTagDefinition 50, InvestigationCatalogItem 135, MedicationGeneric 35, DrugFamily 53, GuidelineSource 248. Duplicate groups: zero.
- Fresh disposable database: all 51 migrations applied from empty, including the six production migrations and all clinical reconstruction migrations; empty final schema diff; no manual resolution.
- Fresh seed twice produced stable counts: Permission 202, ClinicalTagDefinition 50, InvestigationCatalogItem 84, DrugFamily 53, GuidelineSource 23, MedicationGeneric 0. Duplicate groups: zero.
- No patient or visit record was changed by seed, and no official-medication verification claim was created.
- Both disposable databases used for reconciliation and full-suite QA were deleted after verification.
