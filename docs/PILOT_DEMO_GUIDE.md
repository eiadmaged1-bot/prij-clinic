# Pilot Demo Guide

Date: 2026-06-28

Prij Clinic V0.1 is a controlled local/private demo. It is not production-ready, not a medical device, and must not be used with real patient data.

## Start The Demo

```powershell
npm run dev:stop
docker compose up -d postgres
npm run prisma:repair
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`.

## Stop The Demo

```powershell
npm run dev:stop
```

## Demo Login

Use seeded local demo staff accounts only. The default local password is `LocalDev123!` unless overridden in local `.env`.

```text
demo.owner@prij.local
demo.doctor@prij.local
demo.reception@prij.local
demo.accountant@prij.local
demo.nurse@prij.local
```

Do not use real clinic credentials.

## UI Tour

- `/` premium demo landing page.
- `/login` staff demo login.
- `/dashboard` command center with workflow shortcuts and safety status.
- `/patients` and `/patients/new` registration workflow.
- `/appointments`, `/calendar`, and `/queue` scheduling and front-desk workflow.
- `/encounters`, `/prescriptions`, `/investigations`, and `/reports` clinical workflow pages.
- `/pregnancies` and `/ultrasound` OB workflow pages.
- `/billing` invoice and payment foundation without a real gateway.
- `/consents` consent foundation demo.
- `/ai-drafts` disabled/mock-only AI draft review placeholder.

## Safe Demo Flow

1. Sign in with a seeded demo user.
2. Open Dashboard and review the safety warnings.
3. Create or locate a fake demo patient.
4. Schedule a demo appointment.
5. Check in the patient through Queue.
6. Open Encounters and create a demo-only doctor-authored draft.
7. Review prescriptions, investigations, reports, pregnancy, and OB ultrasound pages.
8. Review Billing without entering real payment data.
9. Record only fake/demo consent data if needed.
10. Open AI Drafts and confirm AI remains disabled/mock-only and doctor-review-only.

## Verification Commands

```powershell
npm run typecheck
npm run build
npm run smoke:test
npm run test:security
npm run test:security:ci
npm run test:security:expanded
npm run test:e2e:v01
```

## Safety Rules

- No real patient data.
- No real report files or PHI uploads.
- No real payment details.
- No real AI API calls.
- AI cannot diagnose, prescribe, sign, update final records, or bypass RBAC, consent, audit, or doctor approval.
- OB ultrasound screens do not diagnose FGR or any condition.

## Demo Limitations

- UI forms are intentionally basic and demo-safe.
- Consent is a foundation only, not production legal consent enforcement.
- File storage for real PHI is not implemented.
- Production monitoring, MFA, legal review, and backup restore proof remain future work.
