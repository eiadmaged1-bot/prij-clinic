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

- Merge the Codex B browser UX for Pregnancy Overview, Obstetric History, Antenatal Visits, Ultrasound, Investigations, Reports, Follow-up, print views, and doctor templates.
- Wire the antenatal visit form and ultrasound report builder to final persisted fields after backend merge.
- Validated gestational-age calculation display.
- Clinician-reviewed ultrasound report workflow.
- Production consent, legal review, PHI file storage, audit retention, and patient access policy.

## Browser UX Added By Codex B

- Patient-file Pregnancy workspace with large readable cards and 3D medical icons.
- Pregnancy dashboard showing LMP, EDD, dating method, gravida/para, status, visit prompts, ultrasound summary, and notes.
- Antenatal visit form UI for symptoms, BP, weight, fetal heart, fundal height, examination, plan, investigations, and next follow-up.
- OB ultrasound report builder for scan type, indication, gestational age, fetus selector, presentation, placenta, amniotic fluid, fetal heart, BPD, HC, AC, FL, EFW, Doppler note, impression, and report status.
- Browser print-friendly summaries for patient summary, antenatal visit summary, report cards, and ultrasound draft.
- OB/GYN doctor workflow templates for pregnancy booking, antenatal follow-up, ultrasound visit, gynecology visit, follow-up visit, and procedure visit placeholder.

All UX additions remain recording-only and do not add diagnosis, fetal-risk scoring, percentile interpretation, fetal-image AI, real AI calls, real payment gateway behavior, or PHI upload.
