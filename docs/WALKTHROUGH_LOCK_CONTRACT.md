# Walkthrough Lock Contract

v0.15.0 preserves the v0.14.4 walkthrough lock.

Protected routes:

- `/clinic-day/walkthrough`
- `/patients/new`
- `/reception/check-in`
- `/doctor/waiting`
- `/doctor/visit`
- `/prescriptions`
- `/investigations`
- `/patients/[id]/print/packet`

Rules:

- Do not remove walkthrough launchers.
- Do not remove PatientPicker where v0.14.4 locked it.
- Do not reintroduce Patient ID prompts.
- Do not show Sex or Patient Type in the new patient flow.
- Do not break compact doctor waiting cards.
- Do not add automatic dose or prescription behavior.
- Do not remove follow-up or print packet discoverability.

The regression scripts `test:v144:clinic-walkthrough` and `test:v150:mvp-business-walkthrough` protect this contract.
