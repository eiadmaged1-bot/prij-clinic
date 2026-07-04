# v0.12.5 Clinic Usability Lock

v0.12.5 focuses on browser usability and medication safety source review prep.

## Product-visible workflow

- Login wording remains local-demo aware without exposing secrets beyond local setup documentation.
- Patient list has a clear New Patient action, search, refresh, and friendly empty state.
- Patient creation saves a patient file and opens the patient workspace.
- Patient workspace prioritizes the active patient header and Start Visit action.
- Doctor Visit flow shows: History, Care Assist, Encounter, Prescription, Investigations, Follow-up, Packet.
- Prescription drafting is generic-first. Dose, frequency, and duration are not auto-filled.
- Medication Safety Terminal stays visible beside prescription search and updates on hover, focus, or selection.
- Investigation selection remains visible before saving and saved investigation names appear in the packet.
- Follow-up is manual date, title, and note only.
- Packet output includes encounter, history, Care Assist findings, generic medication names, requested investigations, and follow-up.

## Safety

- No fake pregnancy/lactation safety claims were added.
- Doctor approval is required for clinical output.
- No autonomous diagnosis, prescribing, dosing, or final plan generation was added.
- No OpenAI runtime clinical calls, WhatsApp, DICOM/PACS, insurance, real payment gateway, destructive DB command, DB reset, or migration deletion was added.

## Verification

```powershell
npm run test:v125:clinic-usability-lock
```
