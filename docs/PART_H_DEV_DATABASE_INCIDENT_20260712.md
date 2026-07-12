# Part H Persistent Development Database Incident — 2026-07-12

## Incident Summary

At `2026-07-12T07:19:52Z`, a previous task executed:

```text
npx prisma db push --accept-data-loss
```

The retained Antigravity task result identifies the target as database `prij_clinic_dev`, schema `public`, on `localhost:5432`. The command completed successfully and synchronized that persistent development database to the then-current Prisma schema.

## Target Classification

- Database: `prij_clinic_dev`
- Classification: persistent development
- Host classification: local development PostgreSQL
- Schema: `public`
- Disposable: no
- Recovery performed in this sprint: no

Repository Docker configuration names `prij_clinic_dev` as the development database. The retained command did not target a database named `prij_clinic_active`, and the read-only local `pg_catalog.pg_database` inventory contains no database with that name. The incident evidence therefore identifies the affected target as local persistent development, not an active production clinic database. This conclusion does not inventory unrelated remote infrastructure.

## Exact Affected Columns

The Prisma command reported and dropped these columns:

| Table | Column | Non-null values reported before drop |
| --- | --- | ---: |
| `GuidelineChunk` | `reviewStatus` | 2,577 |
| `GuidelineDocument` | `archivedAt` | 5 |
| `GuidelineDocument` | `citationLabel` | 51 |
| `GuidelineDocument` | `documentType` | 51 |
| `GuidelineDocument` | `reviewStatus` | 51 |
| `GuidelineImportJob` | `createdByUserId` | 14 |
| `GuidelineImportJob` | `importType` | 65 |
| `GuidelineImportJob` | `summary` | 14 |
| `GuidelineQueryLog` | `actorUserId` | 36 |
| `GuidelineQueryLog` | `mode` | 252 |
| `GuidelineQueryLog` | `queryText` | 252 |
| `GuidelineReviewDecision` | `reviewerUserId` | 5 |
| `GuidelineSection` | `reviewStatus` | 2,549 |
| `GuidelineSection` | `sortOrder` | 2,549 |
| `GuidelineSource` | `abbreviation` | 25 |

Read-only `information_schema.columns` inspection confirms all 15 columns are currently absent.

## Tables, Rows, Indexes, and Constraints

- Affected tables: `GuidelineChunk`, `GuidelineDocument`, `GuidelineImportJob`, `GuidelineQueryLog`, `GuidelineReviewDecision`, `GuidelineSection`, and `GuidelineSource`.
- The retained Prisma output reports column drops only. It does not report any dropped table, broad row deletion, or data-manipulation statement.
- No evidence indicates that rows in these tables were deleted. Data stored specifically inside the dropped columns was removed with those columns.
- The retained output does not enumerate a separately dropped index or constraint. Current read-only catalog output records the surviving Guideline indexes and constraints. Exact historical column-dependent index/constraint definitions cannot be proven from the retained command log and must not be invented.
- Foreign-key-like historical fields (`createdByUserId`, `actorUserId`, and `reviewerUserId`) may previously have had dependent constraints, but no retained schema artifact establishes their exact names or definitions.

## Data-Loss Determination

Data loss occurred in the persistent development database. At least the non-null values counted above became unavailable when their columns were dropped. Adding columns back would restore structure only; it would not restore those values. Recovery requires a trustworthy pre-incident backup or another authoritative source.

No evidence shows deletion of patient rows or other table rows, and this investigation did not query patient data.

## Evidence

1. Antigravity task `task-4756` records the exact command, target database, warning list, non-null counts, successful completion, and Prisma generation.
2. `scripts/part-h-dev-database-incident-report.mjs` performs read-only `information_schema` and `pg_catalog` inspection, rejects ambiguous database identity, prints no credentials, and confirms the current absence of the 15 columns.
3. Current Prisma schema and migrations do not define the removed historical columns.
4. A backup directory dated before the incident exists outside the repository. Backup contents were not opened, and its completeness or restorability is therefore unverified.

## Drift Position

- Persistent development database versus current Prisma schema: the Guideline objects inspected match the current schema shape after the destructive push, including absence of the historical columns. This does not make the lost data recoverable or the operation acceptable.
- Persistent development database versus migration history: `db push` bypassed migration history, so schema shape alone cannot establish migration-chain integrity.
- Clean migration-chain database: to be created and verified in Checkpoint 2 using a fresh database whose name contains `_test_part_h_`; this report will not mutate `prij_clinic_dev`.

## Recovery Options and Recommendation

Recommended recovery is an isolated restore assessment:

1. Preserve the current persistent development database unchanged.
2. Validate a pre-incident backup in a newly created isolated database.
3. Confirm the historical columns and value counts there without exposing content.
4. Decide with the data owner whether to restore the whole development database or perform a separately reviewed, field-specific recovery.
5. Never infer lost values or repopulate them with synthetic content.

No recovery was executed during this sprint. No additional persistent-database mutation was performed during this assessment.

## Production/Active Database Impact

Active production clinic database affected: **No, based on the retained command target and local catalog evidence.** The command targeted local `prij_clinic_dev`, classified by repository configuration as persistent development. No local `prij_clinic_active` database is present. This statement does not claim that remote production infrastructure was inventoried.
