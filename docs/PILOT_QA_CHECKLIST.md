# Pilot QA Checklist

Use fake/demo data only.

## Automated Gates

- [ ] `git diff --check`
- [ ] `npm run prisma:generate`
- [ ] `npm run prisma:migrate:deploy`
- [ ] `npm run prisma:seed`
- [ ] `npm run staging:simulate`
- [ ] `npm run test:v180:staging-smoke`
- [ ] `npm run test:v180:backup-staging-readiness`
- [ ] `npm run test:v181:browser-qa-lock`
- [ ] `npm run test:v144:clinic-walkthrough`
- [ ] `npm run test:v150:mvp-business-walkthrough`
- [ ] `npm run test:v160:security-real-data-readiness`
- [ ] `npm run test:v161:security-deployment-prep-lock`
- [ ] `npm run test:v170:ai-safety-layer`
- [ ] `npm run test:v170:prompt-injection-guard`
- [ ] `npm run test:v170:safe-ai-assistant`
- [ ] `npm run test:ai:regression`
- [ ] `npm run test:security:ci`
- [ ] `npm run test:security:expanded`
- [ ] `npm run test:accounts:rbac`
- [ ] `npm run test:web:api-base`
- [ ] `npm run test:security:cors`
- [ ] `npm run test:web:hydration-root`
- [ ] `npm run test:security:image-metadata`
- [ ] `npm run test:v120:no-fake-ui`
- [ ] `npm run typecheck`
- [ ] `npm run build`

## Manual Role Signoff

- [ ] Owner
- [ ] Admin
- [ ] Doctor
- [ ] Receptionist
- [ ] Accountant
- [ ] Nurse

## Safety Confirmation

- [ ] Real patient data remains blocked.
- [ ] External AI remains disabled by default.
- [ ] AI output remains draft-only and doctor-approved.
- [ ] No autonomous diagnosis, prescribing, dosing, or treatment ranking is available.
- [ ] No payment gateway, WhatsApp, DICOM/PACS, insurance/TPA, full ledger, or mobile app is presented as included.
- [ ] Normal UI does not expose raw JSON, code, endpoints, schema, Prisma wording, stack traces, or developer wording.
