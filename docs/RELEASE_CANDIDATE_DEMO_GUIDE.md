# Release Candidate Demo Guide

Date: 2026-06-29

Prij Clinic V0.1 is a local/private release-candidate demo for workflow review. It is not production-ready, not a medical device, and must not be used with real patient data.

## Local Login

Start the local app:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000/login
```

Use the accepted local demo admin credential:

```text
Admin ID: eyad
Password: eyad
```

This credential is for local/private demo use only.

## Older Doctor Demo Flow

1. Sign in locally.
2. Open Doctor Mode.
3. Review the large daily cards: waiting queue, today's patients, next action.
4. Open Patients and choose a demo patient file.
5. Confirm the patient header shows the current file, contact, status, and Start Visit action.
6. Use the patient tabs for Overview, Visits, Prescriptions, Orders & Reports, Pregnancy, Billing, Files, and Timeline.
7. Open Guided Visit and move through Complaint, History, Examination, Impression, Prescription, Orders, Follow-up, and Finish Visit.
8. Save only demo draft text. The doctor remains responsible for clinical content.

## Display Comfort

The top bar has Comfort, Large, and Compact display controls.

- Comfort: default readable spacing for routine demo.
- Large: bigger controls for older doctors or tablet use.
- Compact: denser view for laptop operations.

## Demo Boundaries

- Use fake/demo patient records only.
- Do not enter real names, phone numbers, identifiers, histories, reports, or payment details.
- AI is disabled and draft-only. It cannot diagnose, prescribe, sign, or update final records.
- No external AI provider is called.
- No real payment gateway is connected.
- Real report/private clinical file upload is disabled.
- Admin and appearance tools remain owner/admin-only.

## Codex A Integration Notes

Codex A owns backend persistence, Prisma/schema, clinical APIs, patient-context semantics, and DB-heavy tests. This branch intentionally limits changes to frontend polish, visual QA, and release-candidate demo documentation.
