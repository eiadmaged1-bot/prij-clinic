# Doctor Visit Signature

When a doctor clicks Start Visit, the encounter stores:

- `startedByUserId`
- `doctorDisplayNameSnapshot`
- `doctorColorSnapshot`
- `startedAt`

The patient timeline and visit flow show doctor name plus a color marker. Color is never the only identifier.

Owner/Admin can update a clinical staff doctor color through account doctor profile settings. The update requires a reason and is audited.

Reception can create/check in queue visits, but the clinical doctor is assigned only when a doctor starts the visit.
