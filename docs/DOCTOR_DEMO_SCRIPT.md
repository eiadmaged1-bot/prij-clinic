# Doctor Demo Script

## Goal

Show an older doctor a calm daily workflow with large actions, readable cards, and no technical wording.

## Script

1. Sign in at `http://localhost:3000/login` with the local demo account.
2. Open Doctor Mode.
3. Point out the three large cards: Waiting queue, Today's patients, and Next action.
4. Click Open Patient.
5. Open a demo patient file.
6. Confirm the patient header: patient name, file number, contact, status, and Start Visit.
7. Click Start Visit.
8. In Guided Visit, move through Complaint, History, Examination, Impression, Prescription, Orders, Follow-up, and Finish Visit.
9. Use Save Draft to show the demo-safe visit shell.
10. Return to the patient file and open Pregnancy.
11. Show Pregnancy Overview, Obstetric History, Antenatal Visits, Ultrasound, Investigations, Reports, and Follow-up.
12. Open the ultrasound report builder and point out that measurements are recording-only and interpretation is doctor-completed.
13. Use the print buttons to show browser print-friendly clinical summaries.

## Talking Points

- The doctor writes and reviews the note.
- The app does not diagnose automatically.
- Prescription text is manual and doctor-reviewed.
- AI is disabled in V0.1 and cannot update final records.
- OB/GYN templates guide the visit type but do not diagnose, prescribe, or auto-complete clinical records.
- The current branch is browser UX/reporting polish only; persistence improvements are expected from Codex A.
