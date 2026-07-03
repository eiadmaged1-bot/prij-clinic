# v0.10.9 Schema Integrity Remediation

Date: 2026-07-03
Branch: `fix/v0.10.9-schema-integrity-compile-and-migration`

## Summary

v0.10.9 keeps the v0.10.8 schema integrity hardening intact while making create paths and local migration readiness operational.

- Queue ticket create paths now share a UTC date-only helper for `queueDate`.
- Seeded demo queue tickets set explicit `checkedInAt` and `queueDate`.
- Encounter create paths provide `branchId` from the linked patient branch and fail if branch context is missing.
- Legacy queue duplicate remediation scripts use raw SQL so they can run before the `queueDate` Prisma model field exists in the database.
- No database reset, queue-ticket deletion, table drop, migration guard bypass, uniqueness weakening, encounter branch weakening, or release tag was performed.

## Queue Duplicate Remediation

Expected legacy group:

- Branch: `ada31369-d91e-4071-9de3-865268722c74`
- UTC date: `2026-07-03`
- Old queue number: `1`
- Ticket IDs:
  - `9fb69f14-399a-41d9-b944-d88991e16bee`
  - `61cbcf2e-136f-4d2f-8a3b-014dac6ece3b`

Current configured local DB result:

- `npm run db:v109:queue-duplicates:dry-run`: `duplicateGroups=0`
- `npm run db:v109:queue-migration-ready`: PASS
- `9fb69f14-399a-41d9-b944-d88991e16bee` is preserved unchanged at queue number `1`.
- `61cbcf2e-136f-4d2f-8a3b-014dac6ece3b` is preserved and currently renumbered to queue number `10`.
- Both tickets retain branch `ada31369-d91e-4071-9de3-865268722c74` and UTC `queueDate` `2026-07-03`.
- No queue tickets were deleted.

The remediation apply command was not rerun because the duplicate group was already absent in the configured local DB.

## Migration Result

- `npm run prisma:migrate:deploy`: PASS, no pending migrations to apply.
- `_prisma_migrations` contains a successful `20260703143000_schema_integrity_hardening` row finished at `2026-07-03T09:12:53.515Z`.
- `npm run prisma:generate`: initially hit a Windows Prisma query-engine DLL file lock, then PASS after stopping the local API process.
- `npm run prisma:seed`: PASS.

## Tests

All requested commands exited `0`:

- `npm run test:db:queue-date`: PASS
- `npm run test:db:encounter-void`: PASS
- `npm run test:web:api-base`: PASS
- `npm run test:security:cors`: PASS
- `npm run test:security:image-metadata`: PASS
- `npm run test:security:document-upload`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm run test:v093:ui-text`: PASS
- `npm run test:security:ci`: PASS, 25 pass, 1 warning
- `npm run test:security:expanded`: PASS, expanded summary 6 pass, 0 fail
- `npm run test:accounts:rbac`: PASS, 18 pass, 0 warnings

Warnings retained from existing test suites:

- AI endpoint warning notes the implemented endpoint is `/ai-drafts`, not `/ai/drafts`.
- Some route-auth checks are broad authenticated routes without a denied-role assertion.
- Patient-to-doctor assignment is not modeled; doctor patient reads remain branch-scoped.
