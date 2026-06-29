# OB/GYN Core MVP

Date: 2026-06-29

This document describes the V0.1 OB/GYN recording foundation added for the operational clinic MVP branch. It is for local demo and engineering review only.

## Implemented Records

- Pregnancy episode with patient, branch, gravida, para, living, abortions, LMP, EDD, dating method, active/inactive/ended style status, recording-only risk flags, and notes.
- Previous pregnancy history records for obstetric history only.
- Fetus records linked to a pregnancy episode, supporting singleton or A/B/C labels, chorionicity, amnionicity, status, and notes for multiple pregnancy recording.
- Antenatal visit records linked to a pregnancy episode and patient, including visit date, gestational age display, BP, weight, pulse, edema, urine protein, symptoms, examination, fetal heart note, fundal height, plan, medications note, investigations note, and next follow-up date.
- OB ultrasound recording records linked to patient and optionally pregnancy, fetus, and encounter, including raw biometry fields and doctor-written impression text.
- Patient timeline entries for pregnancy episode, previous pregnancy history, fetus create/update, antenatal visits, ultrasound records, and pregnancy-related orders/reports.

## Safety Boundaries

- No automatic FGR diagnosis.
- No fetal-image AI.
- No percentile or growth-chart engine.
- No automated risk scoring.
- No AI-generated final clinical record.
- Ultrasound, Doppler notes, risk flags, fetus records, and antenatal data are recording-only; clinician interpretation is required.

## API Coverage

- `POST /pregnancies`
- `GET /pregnancies`
- `GET /pregnancies/:id`
- `PATCH /pregnancies/:id`
- `POST /previous-pregnancies`
- `GET /previous-pregnancies`
- `POST /pregnancies/:id/fetuses`
- `GET /pregnancies/:id/fetuses`
- `PATCH /pregnancies/:pregnancyId/fetuses/:fetusId`
- `POST /pregnancies/:id/antenatal-visits`
- `GET /pregnancies/:id/antenatal-visits`
- `POST /ob-ultrasounds`
- `GET /ob-ultrasounds`
- `GET /ob-ultrasounds/:id`
- `PATCH /ob-ultrasounds/:id`
- `POST /patients/:id/ultrasounds`
- `GET /patients/:id/timeline`

## Verification

Run:

```powershell
npm run test:clinical:persistence
npm run test:obgyn:core
```

The test uses fake demo records only and asserts that OB/GYN recording does not introduce diagnostic automation.

## Remaining Work

- Better pregnancy UI for fetus and antenatal visit entry.
- Validated gestational-age calculation display.
- Clinician-reviewed ultrasound report workflow.
- Growth charts, Doppler structured interpretation, DICOM/PACS, and any validated AI remain future work.
- Production consent, legal review, PHI file storage, audit retention, and patient access policy.
