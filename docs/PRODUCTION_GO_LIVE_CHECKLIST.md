# Production Go-Live Checklist

## Code and Branch

- [ ] Confirm branch is `release/production-launch-consolidation`.
- [ ] Confirm no uncommitted unexpected changes.
- [ ] Confirm no push, merge, force-push, or release tag was performed by Codex.
- [ ] Confirm protected checkpoint `checkpoint-pre-production-launch-2026-07-11` remains available.

## Data

- [ ] Run `npm run db:production-launch:inventory`.
- [ ] Review inventory JSON and Markdown.
- [ ] Run `npm run db:production-launch:plan`.
- [ ] Resolve every uncertain model before any apply.
- [ ] Complete database backup outside Git paths.
- [ ] Complete uploaded-file backup outside Git paths.
- [ ] Complete isolated restore drill.
- [ ] Set up system cron job to run `scripts/idempotency-records-cleanup.mjs` every 15 minutes.
- [ ] Keep reset apply disabled until owner/operator approval.

## Security

- [x] Remove reusable auth tokens from browser storage before real data (source-contract tested; legacy values are cleared).
- [ ] Use HttpOnly secure cookie authentication and CSRF protection.
- [ ] Confirm API port 3001 is not publicly exposed.
- [ ] Confirm web public access only uses port 3000 and `/api/backend`.
- [ ] Confirm production secrets are not committed.
- [ ] Confirm backups are encrypted and access-controlled.
- [ ] Confirm PHI/PII is redacted from logs and audit metadata where required.
- [x] Document MIME/extension/magic-byte validation and encrypted quarantine are implemented and source/unit tested.
- [ ] Provision a 32-byte document encryption key and non-secret key identifier through the deployment secret manager.
- [ ] Configure and validate a production malware scanner; production must remain fail-closed while status is `NOT_CONFIGURED`.
- [ ] Apply the patient document security migration through the reviewed deployment workflow (not applied in this sprint).
- [ ] Back up and restore the encrypted document root together with its matching database snapshot and key-version inventory.
- [ ] Run `npm run documents:storage:reconcile` in dry-run mode and review count-only results before any `--apply`.
- [ ] Complete authenticated upload/download browser QA for Doctor, Owner, and restricted Receptionist access.

## Desktop QA

- [x] Doctor Search Patient and New Patient actions are registered and source-tested.
- [x] Doctor Save Patient Only and Save & Start Visit flows are implemented and source-tested.
- [x] High-confidence duplicate creation requires a reason and records an audit event.
- [ ] Exercise doctor create/start against a production-like isolated database.

- [ ] Owner desktop Optimized.
- [ ] Doctor desktop Optimized.
- [ ] Receptionist desktop Optimized.
- [ ] Arabic RTL.
- [ ] English LTR.
- [ ] 1440x900.

## Mobile QA

- [x] Doctor fallback navigation includes Today, Search, New Patient, Current Visit, and Account.
- [x] New fallback buttons pass the interaction inventory.
- [ ] Manually validate the doctor fallback at 360px in English and Arabic.

- [ ] Owner mobile Optimized.
- [ ] Doctor mobile Minimalistic.
- [ ] Receptionist mobile Minimalistic.
- [ ] 360x800.
- [ ] 390x844.
- [ ] 430x932.
- [ ] 768x1024.
- [ ] No horizontal overflow.
- [ ] Touch targets are at least 48px.

## Ngrok/Public QA

- [ ] Public web URL reaches only the web application.
- [ ] Login works through `/api/backend`.
- [ ] API origin is not exposed directly.
- [ ] Logout clears the server-side session.
- [ ] Changing a user's password revokes all their active sessions.
- [ ] Deactivating an account revokes all active sessions.
- [ ] Changing an account's roles or permissions revokes all active sessions.
- [ ] Unauthenticated `/auth/me` is a clean unauthorized state, not an API-down state.

## Clinical Safety

- [ ] AI features are disabled unless explicitly approved.
- [ ] AI output is draft-only.
- [ ] Doctor review is required before clinical use.
- [ ] Clinical record changes have audit support.

## Concurrency and Time

- [x] Queue transitions use atomic row-level updates to prevent race conditions.
- [x] Billing payments use SELECT ... FOR UPDATE to prevent lost balance updates.
- [x] Idempotency safety includes canonical hashing and 6m timeout.
- [x] Clinic time is strictly mathematically calculated rather than string parsed.
- [x] Proxy errors correctly parse fallback body.code.

- [x] Part G verified: CSRF, Security Headers, Rate Limits, Audit Logging, Health, Playwright Smoke Tests
