# Release Candidate Demo Guide

Date: 2026-06-29

Prij Clinic V0.1 is a verified local/private release-candidate demo for workflow review. It is not production-ready, not a medical device, and must not be used with real patient data.

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
9. Return to the patient Pregnancy tab to review the OB/GYN workspace.
10. Show Pregnancy Overview, Obstetric History, Antenatal Visits, Ultrasound, Investigations, Reports, and Follow-up.
11. Show the antenatal visit workflow groups: visit details, maternal observations, symptoms, examination, fetal observations, plan, and next follow-up.
12. Show the OB ultrasound report builder groups: scan details, pregnancy/fetus context, presentation, placenta, amniotic fluid, fetal heart, biometry recording, Doppler note, and impression.
13. Explain that all measurements and notes are recording-only and clinician interpretation is required.
14. Use browser print actions for patient summary, antenatal visit summary, and ultrasound report.

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
- OB/GYN print views are browser demo summaries only and are not production medical stationery.

## Operational Verification

Use `docs/MVP_RC_VERIFICATION_CHECKLIST.md` to run the final local demo path:

1. Owner dashboard and Owner Control Center.
2. Reception patient creation, appointment, and queue.
3. Doctor Mode and Guided Visit saving real encounter draft fields.
4. Patient file timeline across appointments, queue, encounter, prescription, orders/reports, OB/GYN, finance, consent, and AI draft placeholder records.
5. Admin/RBAC checks proving non-admins cannot access Admin or Appearance controls.

Production planning is documented in `docs/PRODUCTION_READINESS_PLAN.md`. The exact next sprint is Pilot Demo Data + Browser Walkthrough Hardening.

OB/GYN browser workflow details are documented in `docs/OBGYN_UX_GUIDE.md`.
