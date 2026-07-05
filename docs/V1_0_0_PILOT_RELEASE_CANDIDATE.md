# v1.0.0 Pilot Release Candidate

Sprint: v1.0.0 Pilot Release Candidate

Branch: `release/v1.0.0-pilot-rc`

Expected tag: `v1.0.0-pilot-rc`

This is the first Pilot Release Candidate package for Prij Clinic. It is release packaging, final verification, documentation, and tagging only. It is not a full production release and does not authorize real patient data use.

## Scope

- Preserve the clinic walkthrough lock.
- Preserve the MVP business layer.
- Preserve security and readiness gates.
- Preserve the staging deployment package.
- Preserve the browser QA lock.
- Preserve safe AI assistant draft-only behavior.

No new product features, architecture rewrite, clinical logic, external AI runtime calls, or production medical claims are added in this release candidate.

## Safety Boundaries

- Real patient data remains blocked until legal, privacy, backup, and role-by-role signoff are complete.
- External AI is disabled by default.
- AI output is assistive, draft-only, and must be reviewed and approved by a doctor.
- The system does not autonomously diagnose, prescribe, dose, rank treatments, or write final clinical records from AI output.
- Clinical record changes must remain audit-log capable.
- No real payment gateway, WhatsApp, DICOM/PACS, insurance/TPA, full accounting ledger, or mobile app is included.

## Release Gates

Required final verification:

```powershell
git diff --check
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run staging:simulate
npm run test:v180:staging-smoke
npm run test:v180:backup-staging-readiness
npm run test:v181:browser-qa-lock
npm run test:v144:clinic-walkthrough
npm run test:v150:mvp-business-walkthrough
npm run test:v160:security-real-data-readiness
npm run test:v161:security-deployment-prep-lock
npm run test:v170:ai-safety-layer
npm run test:v170:prompt-injection-guard
npm run test:v170:safe-ai-assistant
npm run test:ai:regression
npm run test:security:ci
npm run test:security:expanded
npm run test:accounts:rbac
npm run test:web:api-base
npm run test:security:cors
npm run test:web:hydration-root
npm run test:security:image-metadata
npm run test:v120:no-fake-ui
npm run typecheck
npm run build
```

Manual role-by-role browser signoff is still required before real clinic use.
