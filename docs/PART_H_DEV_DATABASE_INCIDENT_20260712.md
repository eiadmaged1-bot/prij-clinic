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
| `GuidelineDocument` | `storageRef` | 0/non-null warning not emitted |
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
| `GuidelineVersion` | `publishedYear` | 0/non-null warning not emitted |
| `GuidelineVersion` | `sourceUrl` | 0/non-null warning not emitted |

Read-only `information_schema.columns` inspection and comparison with the clean migration chain confirm all 18 columns are currently absent. The retained Prisma warning enumerated only the 15 columns that held non-null values; migration-chain comparison identified the three additional nullable columns.

## Tables, Rows, Indexes, and Constraints

- Affected tables: `GuidelineChunk`, `GuidelineDocument`, `GuidelineImportJob`, `GuidelineQueryLog`, `GuidelineReviewDecision`, `GuidelineSection`, `GuidelineSource`, and `GuidelineVersion`.
- The retained Prisma output reports column drops only. It does not report any dropped table, broad row deletion, or data-manipulation statement.
- No evidence indicates that rows in these tables were deleted. Data stored specifically inside the dropped columns was removed with those columns.
- Clean migration-chain comparison establishes that these indexes were removed by synchronization: `GuidelineChunk_citationLabel_idx`, `GuidelineChunk_reviewStatus_idx`, `GuidelineChunk_sectionId_chunkIndex_key`, `GuidelineDocument_archivedAt_idx`, `GuidelineDocument_reviewStatus_idx`, `GuidelineQueryLog_actorUserId_createdAt_idx`, `GuidelineQueryLog_mode_idx`, `GuidelineSection_documentId_idx`, `GuidelineSource_name_key`, and `GuidelineSource_status_idx`.
- No clean-chain constraint difference is attributable to these historical scalar fields; the authoritative migration did not create foreign keys for `createdByUserId`, `actorUserId`, or `reviewerUserId`.

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
- Clean migration-chain database: `prij_clinic_test_part_h_chain_final` received all 46 migrations through `prisma migrate deploy`; required schema objects and indexes were present and the final schema had no unexpected drift. This verification did not mutate `prij_clinic_dev`.

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
