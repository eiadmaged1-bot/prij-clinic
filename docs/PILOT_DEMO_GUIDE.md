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
Demo Owner:        demo.owner@prij.local       / LocalDev123!
Demo Doctor:       demo.doctor@prij.local      / LocalDev123!
Demo Reception:    demo.reception@prij.local   / LocalDev123!
Demo Accountant:   demo.accountant@prij.local  / LocalDev123!
Demo Nurse:        demo.nurse@prij.local       / LocalDev123!
```

Do not use real clinic credentials.

The `/login` page displays the Demo Owner credentials and has a `Use demo login` button.

## UI Tour

- `/` premium demo landing page.
- `/login` staff demo login.
- `/dashboard` focused operational overview and patient-file entry point.
- `/patients` patient file list and search.
- `/patients/new` creates a demo-safe patient file and opens it after save.
- `/patients/:id` patient file workspace with patient-scoped tabs.
- `/appointments`, `/calendar`, and `/queue` scheduling and front-desk workflow.
- `/encounters`, `/prescriptions`, `/investigations`, and `/reports` clinical workflow pages.
- `/pregnancies` and `/ultrasound` OB workflow pages.
- `/billing` invoice and payment foundation without a real gateway.
- `/consents` consent foundation demo.
- `/ai-drafts` disabled/mock-only AI draft review placeholder.

## Safe Demo Flow

1. Sign in with a seeded demo user.
2. Open Dashboard and review the safety warnings.
3. Open Patients.
4. Click New Patient File.
5. Enter fake/demo demographics only and save.
6. Continue from the patient file page.
7. Use patient file tabs to move through appointment, queue, encounter, prescription, investigation, report/OB ultrasound, billing, consent, and AI draft placeholder review.
8. Use module pages only for focused module work; they intentionally do not show unrelated dashboard content.

## Create A Patient File

1. Go to `Patients`.
2. Click `New Patient File`.
3. Keep or regenerate the demo MRN.
4. Enter fake first and last names.
5. Optionally add fake/demo sex, DOB, phone, email, and notes.
6. Click `Save and open patient file`.
7. The app redirects to `/patients/:id`.

Do not enter real patient names, phone numbers, addresses, clinical histories, insurance data, report files, or payment details.

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
- Patient-file tabs filter by `patientId` where the current APIs expose enough data; otherwise they show clean empty states.
- Consent is a foundation only, not production legal consent enforcement.
- File storage for real PHI is not implemented.
- Production monitoring, MFA, legal review, and backup restore proof remain future work.
