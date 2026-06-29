# OB/GYN UX Guide

Date: 2026-06-29

This guide describes the browser-facing OB/GYN workflow for the V0.1 demo. It is for fake/demo data only and is not approved for real patient use.

## Patient File Workspace

Open a patient file, then choose either the Gynecology tab or the Pregnancy tab. The workspace is organized for a doctor who wants one calm view.

The Gynecology tab contains:

- general gynecology visit template
- abnormal bleeding starter
- pelvic pain starter
- PCOS starter
- fibroid or ovarian cyst starter
- contraception counseling starter
- gynecology timeline cards
- browser print summary

The Pregnancy tab contains:

- Pregnancy Overview
- Obstetric History
- Antenatal Visits
- Ultrasound
- Investigations
- Reports
- Follow-up

The page stays patient-focused. It does not show unrelated owner/admin content.

## General Gynecology Workspace

The general gynecology workspace starts from a clear Start Gynecology Visit action and lets the doctor select a recording template.

The general visit template records:

- reason for visit
- menstrual history
- bleeding pattern
- pain symptoms
- discharge or infection symptoms
- obstetric history summary
- contraception history
- relevant medical or surgical history
- examination notes
- doctor-written impression
- doctor-written plan
- follow-up date

Problem-focused starters are included for abnormal uterine bleeding, pelvic pain, PCOS, fibroid or ovarian cyst, and contraception counseling.

These starters do not diagnose, recommend treatment, recommend contraception methods, or prescribe. They only structure clinician-entered notes.

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

## Antenatal Visit Form

The antenatal visit card gives the doctor a readable form grouped as:

- Visit details.
- Maternal observations.
- Symptoms.
- Examination.
- Fetal observations.
- Plan.
- Next follow-up.

When a pregnancy episode exists, Save Draft / Save Visit records the antenatal visit through the pregnancy antenatal visit API and the event appears in the patient timeline. If no pregnancy episode exists, the form tells the user to create one first.

## Ultrasound Report Builder

The ultrasound report builder includes:

- Scan details.
- Pregnancy and fetus context.
- Fetal presentation.
- Placenta.
- Amniotic fluid.
- Fetal heart.
- Biometry recording for BPD, HC, AC, FL, and EFW.
- Doppler note placeholder.
- Doctor-written impression.

Measurements are recorded for clinician review. Interpretation must be completed by the doctor.

The app does not provide:

- automatic FGR diagnosis
- fetal risk scoring
- percentile engine
- fetal-image AI
- automatic clinical impression

## Print-Friendly Summaries

Browser print styling is available for:

- patient summary
- gynecology summary
- antenatal visit summary
- ultrasound report
- linked report summaries

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
- No automatic general gynecology diagnosis.
- No automatic treatment plan.
- No automatic contraception recommendation.
- No automatic OB ultrasound interpretation.
- No automatic FGR diagnosis.
- Doctor-authored or doctor-reviewed content remains required.
