# MVP Pilot Workflow Lock Report

Date: 2026-06-29

Branch: `pilot/mvp-obgyn-workflow-lock`

Base: `auth/accounts-session-rbac-hardening` at `87eb7e5`

## Supported Pilot Workflow

The MVP pilot flow now supports:

```text
Owner login -> patient file -> doctor workflow -> OB/GYN pregnancy workspace -> antenatal visit -> ultrasound report -> timeline -> print -> role-safe account behavior
```

## Finance Deepening Note

The follow-up finance/report sprint adds MVP pilot finance depth on top of this locked workflow: service catalog placeholders, catalog-linked invoice lines, manual payments, reason-required refunds and voids, daily closing, patient statements, owner finance reports, print placeholders, and audit coverage. This remains fake/demo data only with no real payment gateway, no insurance/TPA, and no full accounting ledger.

The patient file is the central workflow surface. The Pregnancy tab contains Pregnancy Overview, Obstetric History, Antenatal Visits, Ultrasound, Investigations, Reports, Follow-up, and print actions.

## Demo After Stable Accounts

1. Sign in as `eyad` / `eyad` in local demo only.
2. Confirm the topbar shows display name, login ID, role, Dashboard, Accounts, and Logout.
3. Open Patients and choose or create a fake/demo patient.
4. Start a guided visit or open the Pregnancy tab.
5. Review pregnancy overview and obstetric history.
6. Save an antenatal visit only after a pregnancy episode exists.
7. Save an OB ultrasound report as recording-only data.
8. Confirm OB/GYN events appear in the patient timeline.
9. Use browser print for patient, antenatal, and ultrasound summaries.
10. Sign in as a non-admin demo user and confirm `/admin/accounts` is denied.

## Recording-Only Boundaries

- Ultrasound measurements are recorded for clinician review.
- Doppler notes are placeholders for clinician-authored notes.
- Fetal biometry is stored as raw recording fields only.
- Pregnancy risk flags and notes are clinician-entered text only.
- Clinician interpretation is required before clinical use.

## Explicitly Not Included

- No automatic diagnosis.
- No automatic FGR diagnosis.
- No fake percentile engine.
- No DICOM/PACS workflow.
- No PHI imaging upload.
- No real AI calls.
- No WhatsApp integration.
- No real payment gateway.
- No inventory, insurance, or telemedicine workflow.

## Verification

Use fake/demo data only:

```powershell
npm run typecheck
npm run build
npm run test:security:ci
npm run test:security:expanded
npm run test:theme:ui
npm run test:doctor:ux
npm run test:visual:qa
npm run test:e2e:v01
npm run test:clinical:persistence
npm run test:obgyn:core
npm run test:accounts:rbac
npm run test:staging:smoke
```

## Exact Next Sprint

Pilot Demo Data + Browser Walkthrough Hardening:

- Prepare a clean fake/demo walkthrough dataset.
- Add script-assisted browser verification for the full owner, doctor, receptionist, OB/GYN, print, theme, and account-denial flow.
- Tighten only wording, empty states, print formatting, and small workflow friction found during rehearsal.
- Keep clinical behavior recording-only and doctor-led.
