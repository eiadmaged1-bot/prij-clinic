# OB/GYN UX Guide

Date: 2026-06-29

This guide describes the browser-facing OB/GYN v0.2 workflow after accounts/session hardening. It is for fake/demo data only and is not approved for real patient use.

## Patient File Workspace

Open a patient file, then choose the Pregnancy tab. The workspace is organized for a doctor who wants one calm view:

- Pregnancy Overview
- Obstetric History
- Fetus Records
- Antenatal Visits
- Ultrasound
- Timeline integration
- Investigations
- Reports
- Follow-up

The page stays patient-focused. The account/session topbar remains visible, and owner/admin shortcuts are still controlled by the account permissions system.

## Pregnancy Dashboard

The pregnancy dashboard shows:

- active pregnancy status
- LMP
- EDD
- dating method
- gravida / para
- next visit prompt
- last visit prompt
- ultrasound summary
- important clinician notes

The dashboard is recording-only. It does not calculate risk, diagnose fetal growth restriction, or provide automated interpretation.
The page can start a pregnancy episode for the current fake/demo patient by recording gravida, para, living, abortions, LMP, EDD, dating method, and clinician notes.

## Obstetric History And Fetus Records

The workspace shows prior obstetric history and fetus records linked to the pregnancy episode. The doctor can record:

- previous pregnancy outcome
- year
- gestational age at outcome
- mode of delivery
- birth weight if recorded
- complication note
- fetus label such as Singleton, A, or B
- chorionicity and amnionicity notes

These records are structured history only. They do not infer risk or diagnosis.

## Antenatal Visit Form

The antenatal visit card gives the doctor a readable form with:

- symptoms
- BP
- weight
- fetal heart
- fundal height
- examination
- plan
- investigations
- next follow-up

The form is connected to the v0.2 backend. Saved fake/demo visits appear in the pregnancy workspace and patient timeline.

## Ultrasound Report Builder

The ultrasound report builder includes:

- scan type
- indication
- gestational age
- fetus selector
- fetal presentation
- placenta
- amniotic fluid
- fetal heart
- BPD, HC, AC, FL, EFW recording fields
- Doppler note
- doctor-written impression
- draft/final placeholder status

Measurements are recorded for clinician review. Interpretation must be completed by the doctor.
Saved fake/demo ultrasound drafts appear in the ultrasound section and patient timeline.

The app does not provide:

- automatic FGR diagnosis
- fetal risk scoring
- percentile engine
- fetal-image AI
- automatic clinical impression

## Print-Friendly Summaries

Browser print styling is available for:

- patient summary
- antenatal visit summary
- ultrasound report draft
- linked report summaries
- pregnancy timeline summaries

Use the print buttons in the patient OB/GYN workspace. No generated PDF library or PHI file upload is introduced.

## Doctor Templates

Doctor Mode and the patient workspace expose template cards for:

- New pregnancy booking
- Routine antenatal follow-up
- Ultrasound visit
- Gynecology visit
- Follow-up visit
- Procedure visit placeholder

Templates guide the doctor to the right workflow only. They do not diagnose, prescribe, or auto-complete clinical records.

## Safety Boundaries

- No real patient data.
- No PHI uploads.
- No external AI calls.
- No real payment gateway.
- No automatic diagnosis.
- No automatic OB ultrasound interpretation.
- No automatic FGR diagnosis.
- Doctor-authored or doctor-reviewed content remains required.
