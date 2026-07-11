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
- [ ] Keep reset apply disabled until owner/operator approval.

## Security

- [ ] Remove reusable auth tokens from browser storage before real data.
- [ ] Use HttpOnly secure cookie authentication and CSRF protection.
- [ ] Confirm API port 3001 is not publicly exposed.
- [ ] Confirm web public access only uses port 3000 and `/api/backend`.
- [ ] Confirm production secrets are not committed.
- [ ] Confirm backups are encrypted and access-controlled.
- [ ] Confirm PHI/PII is redacted from logs and audit metadata where required.

## Desktop QA

- [ ] Owner desktop Optimized.
- [ ] Doctor desktop Optimized.
- [ ] Receptionist desktop Optimized.
- [ ] Arabic RTL.
- [ ] English LTR.
- [ ] 1440x900.

## Mobile QA

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
- [ ] Logout clears the session.
- [ ] Unauthenticated `/auth/me` is a clean unauthorized state, not an API-down state.

## Clinical Safety

- [ ] AI features are disabled unless explicitly approved.
- [ ] AI output is draft-only.
- [ ] Doctor review is required before clinical use.
- [ ] Clinical record changes have audit support.

