# General Gynecology Starter

Date: 2026-06-29

Branch: `leap/b-general-gynecology-starter`

This sprint adds the first general gynecology layer to the patient file so the app is not pregnancy-only. It remains local/demo software only and must not be used with real patient data.

Integration status: merged into `integration/v0.3-finance-gyn` with Finance and Reports Deepening. General Gynecology appears as a patient-file tab alongside Pregnancy/OB, Encounters, Prescriptions, Investigations, Billing/Finance, Files, and Timeline.

## Implemented Scope

- Patient-file Gynecology tab for authorized clinical users.
- Recording-only gynecology visit workspace.
- Primary action: Start Gynecology Visit.
- Structured gynecology visit template.
- Problem-focused starter templates:
  - abnormal uterine bleeding
  - pelvic pain
  - PCOS
  - fibroid or ovarian cyst
  - contraception counseling
- Gynecology visit persistence through `GynecologyVisit`.
- Patient timeline events for general gynecology visits and all starter templates.
- Browser print-friendly gynecology summary.
- Focused verification script: `npm run test:gyn:starter`.

## API Surface

- `POST /patients/:id/gynecology-visits`
- `GET /patients/:id/gynecology-visits`
- `GET /gynecology-visits?patientId=:id`
- `GET /gynecology-visits/:id`

Routes use existing clinical encounter permissions:

- Read: `encounter.read`
- Create: `encounter.create`

This keeps non-clinical billing/accounting users out of the gynecology workspace without introducing a new permission model during this sprint.

## Recording Sections

The general gynecology visit template records:

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

## Starter Templates

Abnormal uterine bleeding records cycle regularity, duration, amount, clots, intermenstrual bleeding, postcoital bleeding, associated symptoms, pregnancy test note, and doctor impression.

Pelvic pain records onset, duration, site, relation to cycle, severity, urinary or bowel symptoms, associated symptoms, and doctor impression.

PCOS records cycle pattern, acne or hirsutism note, weight or metabolic risk note, ultrasound note field, labs note field, and doctor impression.

Fibroid or ovarian cyst records finding source, size or location note, symptoms, follow-up plan, and doctor impression.

Contraception counseling records current method, previous methods, contraindication checklist placeholder, counseling notes, chosen method, and follow-up plan.

## Safety Boundaries

- No real patient data.
- No real AI calls.
- No real payment gateway.
- No PHI upload.
- No DICOM/PACS workflow.
- No automatic diagnosis.
- No diagnostic recommendations.
- No automatic treatment plan.
- No contraception method recommendation engine.
- No automatic prescribing.
- Doctor-written impression and plan remain required.
- Clinical writes are audited.

## Future Work

- Fertility and IVF workflows.
- Menopause workflow.
- Colposcopy and oncology workflow.
- Preventive screening workflow.
- Urogynecology workflow.
- More granular gynecology permissions if the clinic wants separation from general encounter permissions.
- Production clinical owner review before real use.
