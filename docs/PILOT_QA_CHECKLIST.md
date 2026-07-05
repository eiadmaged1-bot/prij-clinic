# Pilot QA Checklist

Use fake/demo data only.

## Automated Gates

- [ ] `git diff --check`
- [ ] `npm run test:v101:pilot-signoff-qr`
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

## v1.0.1 Pilot Signoff QR Workflow

- [ ] Universal top-right account/logout menu is visible for every signed-in role, including Receptionist.
- [ ] Tailscale local-dev mobile login works through `npm run dev:tailscale`; Tailscale Funnel/public exposure is not used.
- [ ] Local firewall allows private tailnet TCP `3000` and `3001` only when needed.
- [ ] `/reception` shows Waiting List, New Patient, and Returning Patient only.
- [ ] New Patient opens `/patients/new`.
- [ ] Returning Patient lookup searches by name, phone, patient ID, and MRN where available.
- [ ] Patient file shows Patient QR.
- [ ] QR contains patient ID only; it does not include name, phone, DOB, address, diagnosis, visit text, or medical information.
- [ ] Login and RBAC are required to resolve QR.
- [ ] Receptionist can scan QR to open the patient file.
- [ ] Receptionist can check in/add to queue only after confirmation.
- [ ] Phone camera scanning is manually tested; HTTPS may be required, and manual patient ID fallback exists.

## Safety Confirmation

- [ ] Real patient data remains blocked.
- [ ] External AI remains disabled by default.
- [ ] AI output remains draft-only and doctor-approved.
- [ ] No autonomous diagnosis, prescribing, dosing, or treatment ranking is available.
- [ ] No payment gateway, WhatsApp, DICOM/PACS, insurance/TPA, full ledger, or mobile app is presented as included.
- [ ] Normal UI does not expose raw JSON, code, endpoints, schema, Prisma wording, stack traces, or developer wording.
