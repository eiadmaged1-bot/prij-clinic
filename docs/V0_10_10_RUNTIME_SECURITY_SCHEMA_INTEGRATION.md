# v0.10.10 Runtime Security + Schema Integrity Integration

Branch: `integration/v0.10.10-runtime-security-schema-hardening`

## Included branches and commits

- `security/v0.10.5-lan-cors-hardening` at `35cfe04e7a69c0432b2aa81b1f93d05f987f176d`
- `security/v0.10.6-metadata-only-image-ingest` at `2fd8dccaff08139b65c8057625196f94234427fe`
- `security/v0.10.8-schema-integrity-hardening` at `928c11cfa27e1ad237f223791a166137d50bf9f9`
- `data/v0.10.9-legacy-queue-duplicate-remediation` at `458059d5325ca9bc69824b7e82f043bd9d166341`

All four source branches were already reachable from the integration branch when the merge commands were run. No merge conflicts were produced.

## CORS and LAN runtime hardening

- Frontend API base URL resolution remains explicit-env first, with local-only LAN fallback guarded by `NEXT_PUBLIC_ALLOW_LAN_API_FALLBACK`.
- Backend CORS origin handling preserves exact origin validation by default.
- Private CIDR matching remains local/dev/test-only through explicit `CORS_PRIVATE_CIDRS` and `CORS_PRIVATE_PORTS`.
- Staging and production continue to fail closed for wildcard, dynamic LAN, CIDR, or missing exact origins.

## Image metadata stripping

- Patient document image uploads continue to sanitize image bytes at the API boundary.
- Storage remains `metadata_only` by default.
- `local_demo_file` remains restricted to local/dev/test sanitized output.
- Production local patient file storage remains fail-closed.
- Raw uploaded image bytes are not persisted by the document upload path.

## Schema integrity

- `QueueTicket.queueDate` is preserved.
- The `@@unique([branchId, queueDate, queueNumber])` queue constraint is preserved.
- The `@@index([branchId, queueDate, status])` queue lookup index is preserved.
- UTC date-only queue grouping and retry behavior around duplicate queue numbers are preserved.
- Guarded migration `20260703143000_schema_integrity_hardening` is preserved.
- `Encounter.branchId` remains required.

## Queue duplicate remediation

- `scripts/v109-resolve-legacy-queue-duplicates.mjs` is preserved.
- `scripts/v109-verify-queue-date-migration-ready.mjs` is preserved.
- Dry-run, apply, and migration readiness npm scripts are preserved.
- Remediation remains local/dev/test-focused and does not delete queue tickets.

## Encounter voiding

- Encounter void fields are preserved.
- `PATCH /encounters/:id/void` is preserved.
- `encounter.void` permission is preserved.
- Signed and voided encounter update protections are preserved.
- Encounter voiding remains audited and permission-controlled.

## Production fail-closed notes

- CORS requires exact production/staging origins.
- LAN fallback behavior is not enabled for production.
- Local patient file storage is not allowed in production.
- AI output remains draft-only and cannot sign or insert final clinical records.
- RBAC, patient scope, audit logging, and signed/voided encounter restrictions remain active.

## Tests run

- PASS: `git grep -n -E "^(<<<<<<<|=======|>>>>>>>)"` returned no matches.
- PASS: `git diff --check`
- PASS: `npx prisma validate --schema apps/api/prisma/schema.prisma`
- PASS: `npm run prisma:repair`
- PASS: `npm run db:v109:queue-migration-ready`
- PASS: `npm run prisma:migrate:deploy`
- PASS: `npm run prisma:generate` after stopping a Windows file lock from a running local API process.
- PASS: `npm run prisma:seed`
- PASS: `docker compose up -d postgres`
- WARN: `npm run dev:start` does not exist in this repository; `npm run dev` was used as the actual local service startup command.
- PASS: `npm run wait:local-app`
- PASS: `npm run test:web:api-base`
- PASS: `npm run test:security:cors`
- PASS: `npm run test:security:image-metadata`
- PASS: `npm run test:security:document-upload`
- PASS: `npm run test:db:queue-date`
- PASS: `npm run test:db:encounter-void`
- PASS/WARN: `npm run test:security:ci` passed with one warning that the implemented AI endpoint is `/ai-drafts`, not `/ai/drafts`.
- PASS/WARN: `npm run test:security:expanded` passed with warnings for the AI route naming, broadly available authenticated routes, and branch-scoped doctor patient reads.
- PASS: `npm run test:accounts:rbac`
- PASS: `npm run typecheck`
- PASS: `npm run build`
- PASS: `npm run test:v093:ui-text`

## Remaining limitations

- This integration is not a release and no release tag was created.
- Manual browser QA remains required before any release decision.
- Production hosting, privacy, legal, medical-device, and clinical governance signoff are not completed by this integration.
- Production patient document storage still needs approved object storage, malware scanning, download/preview RBAC, patient scope checks, consent checks, expiring access, and audit review.
- Production or staging queue duplicate remediation requires a separate approved operational plan with backup and audit review.
- Doctor patient reads remain branch-scoped where the application has not modeled patient-to-doctor assignment.
