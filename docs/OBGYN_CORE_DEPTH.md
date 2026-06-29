# OB/GYN Core Depth Backend

Date: 2026-06-29

Branch: `leap/a-obgyn-core-depth`

This sprint deepens the OB/GYN backend for recording real clinic workflow structure with fake/demo data only. It does not add diagnostic automation.

## Implemented Backend Depth

- Pregnancy episodes now support gravida, para, living, abortions, LMP, EDD, dating method, status, notes, and recording-only risk flags.
- Previous pregnancy history can be recorded with outcome, year/date, gestational age at outcome, delivery mode, birth weight, sex, complications, and notes.
- Fetus records support singleton or A/B/C labels, chorionicity, amnionicity, status, notes, and update/list APIs for multiple pregnancy recording.
- Antenatal visits support visit date, gestational age display, BP, weight, pulse, edema, urine protein, symptoms, examination, fetal heart note, fundal height, plan, medication note, investigations note, and next follow-up date.
- OB ultrasound records support patient, pregnancy, fetus, encounter, scan date/time, scan type, indication, gestational age display, presentation, placenta, amniotic fluid note, fetal heart note, raw BPD/HC/AC/FL/EFW fields, Doppler note, doctor-written impression, and draft/final/review status.
- Patient timeline now includes pregnancy episode, previous pregnancy history, fetus create/update, antenatal visit, ultrasound, and existing pregnancy-related orders/reports.

## API Surface

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
- `PATCH /ob-ultrasounds/:id/review`
- `POST /patients/:id/ultrasounds`
- `GET /patients/:id/timeline`

## Safety Boundaries

- Recording-only clinical behavior.
- No automatic diagnosis.
- No automatic FGR diagnosis.
- No fake percentile engine.
- No fetal-image AI or diagnostic image interpretation.
- No automated fetal risk score.
- No external AI calls.
- Clinician interpretation is required for ultrasound, Doppler notes, risk flags, and antenatal findings.

## Verification

Run with the API started against fake/demo seed data:

```powershell
npm run test:obgyn:core
npm run test:clinical:persistence
npm run test:doctor:ux
npm run test:visual:qa
```

The OB/GYN core test creates fake/demo records only, verifies role denial, checks timeline entries, checks audit events, and rejects forbidden diagnostic interpretation text in ultrasound responses.

## Pilot Workflow UX

The patient-file Pregnancy tab is the pilot workspace for the doctor flow. It now presents:

- Pregnancy Overview with the primary antenatal workflow action.
- Obstetric History recording summary.
- Antenatal visit form grouped by visit details, maternal observations, symptoms, examination, fetal observations, plan, and next follow-up.
- OB ultrasound report builder grouped by scan details, pregnancy/fetus context, presentation, placenta, amniotic fluid, fetal heart, biometry recording, Doppler note, and doctor-written impression.
- Patient, antenatal, and ultrasound browser print actions.

These forms remain recording-only and do not add automatic interpretation.

## Future Items

- Clinician-validated growth chart integration.
- Validated gestational age calculations and display rules.
- Doppler structured measurements after clinical review.
- DICOM/PACS/file storage workflow after PHI storage controls are approved.
- Validated AI only after consent, RBAC, audit, privacy, vendor, and doctor-review gates pass.
