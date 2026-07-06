# v1.3.0 Doctor Signature + Case Library + Internal Staff Chat

This sprint adds three connected clinic workflows after v1.2.1:

- Doctor visit signature: the doctor who clicks Start Visit is stamped on the visit.
- Doctor case library: doctors can browse own cases; trusted doctors, Owner, and Admin can browse colleague cases.
- Internal staff chat: authenticated staff can exchange internal messages with per-recipient seen/read status.

Safety boundaries:

- External AI remains disabled by default.
- AI output remains draft-only and cannot diagnose, prescribe, dose, rank treatment, or change clinical records autonomously.
- Staff chat is not a formal clinical note.
- Patient-linked staff messages are operational context only.
- Receptionist and Accountant do not get clinical case-library access.
- Local same-PC and Tailscale testing are mandatory before handoff.
