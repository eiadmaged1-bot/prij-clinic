# Doctor-Friendly UX Reset

Date: 2026-06-29

This sprint makes V0.1 easier for an older doctor to use every day. It is still a local/private demo only and must not be used with real patient data.

## What Changed

- `/doctor` is a simple Doctor Mode dashboard focused on waiting patients, today's patients, and the next clinical action.
- `/doctor/visit` is a guided visit flow with large steps: Complaint, History, Examination, Impression, Prescription, Orders, Follow-up, and Finish Visit.
- `/patients/:id` is simplified around the patient file with large Start Visit and patient-scoped actions.
- Patient file tabs are reduced to Overview, Visits, Prescriptions, Orders & Reports, Pregnancy, Billing, Files, Timeline, and More.
- A reusable `ThreeDMedicalIcon` component provides original 3D-style medical icons for modules, tabs, actions, and empty states.
- The top bar has Comfort, Large, and Compact display modes for readability and daily-use ergonomics.

## Doctor Flow

1. Sign in with local demo credentials.
2. Open Doctor Mode.
3. Open the patient file.
4. Click Start Visit.
5. Move through the guided steps.
6. Save a local draft or finish the demo visit flow.
7. Return to the patient file for prescriptions, orders, reports, billing, files, and timeline.

## Safety Boundaries

- No real patient data.
- No real AI provider calls.
- No automatic diagnosis, prescribing, signing, or final clinical record update.
- AI remains disabled and draft-only.
- Doctor approval remains required for clinical records.
- Server-side RBAC, audit, and scope checks remain the authority; UI hiding is not the security boundary.

## Remaining UX Limits

- The guided visit flow is currently a front-end workflow shell and does not yet persist each step as a structured encounter from the browser.
- Patient quick actions still open existing module pages in some places instead of patient-context modal forms.
- The timeline only shows records that current MVP APIs expose.
- Mobile/tablet visual QA should be expanded before broader pilot use.
