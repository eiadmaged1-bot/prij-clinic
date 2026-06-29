# OB/GYN Core MVP

Date: 2026-06-29

This document describes the V0.1 OB/GYN recording foundation added for the operational clinic MVP branch. It is for local demo and engineering review only.

## Implemented Records

- Pregnancy episode with patient, branch, gravida, para, living, abortions, LMP, EDD, dating method, status, risk label, and notes.
- Fetus records linked to a pregnancy episode, supporting singleton or A/B/C labels for multiple pregnancy recording.
- Antenatal visit records linked to a pregnancy episode and patient, including visit date, gestational age display, blood pressure, weight, symptoms, fetal heart placeholder, plan, and next follow-up date.
- OB ultrasound draft records linked to patient and optionally pregnancy/encounter.
- Patient timeline entries for pregnancy episode, fetus-adjacent pregnancy records through episode context, antenatal visits, and ultrasound drafts.

## Safety Boundaries

- No automatic FGR diagnosis.
- No fetal-image AI.
- No percentile or growth-chart engine.
- No automated risk scoring.
- No AI-generated final clinical record.
- Ultrasound and antenatal data are recording-only; clinician interpretation is required.

## API Coverage

- `POST /pregnancies`
- `GET /pregnancies`
- `GET /pregnancies/:id`
- `PATCH /pregnancies/:id`
- `POST /pregnancies/:id/fetuses`
- `POST /pregnancies/:id/antenatal-visits`
- `POST /patients/:id/ultrasounds`
- `GET /patients/:id/timeline`

## Verification

Run:

```powershell
npm run test:clinical:persistence
```

The test uses fake demo records only and asserts that OB/GYN recording does not introduce diagnostic automation.

## Remaining Work

- Better pregnancy UI for fetus and antenatal visit entry.
- Validated gestational-age calculation display.
- Clinician-reviewed ultrasound report workflow.
- Production consent, legal review, PHI file storage, audit retention, and patient access policy.
