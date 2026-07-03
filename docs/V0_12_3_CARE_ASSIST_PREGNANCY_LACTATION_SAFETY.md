# v0.12.3 Care Assist + Pregnancy/Lactation Safety

v0.12.3 adds a doctor-assist completeness and safety-review layer.

It adds:
- Care Assist rules, findings, and decisions.
- Missing field checks for patient history and follow-up documentation.
- Pregnancy/lactation medication safety profile metadata for generic medications.
- Safety profile badges in medication and prescription safety UI.
- Doctor accept, dismiss, snooze, and resolve workflow.
- Audit logs for evaluation, decision, and profile updates.

Clinical boundaries:
- Does not diagnose.
- Does not prescribe.
- Does not choose drugs.
- Does not generate dose, frequency, duration, or instructions.
- Does not rank treatments.
- Does not replace doctor review.

Run:

```powershell
npm run prisma:migrate:deploy
npm run prisma:generate
npm run db:v123:seed:care-assist
npm run db:v123:med-safety:ready
npm run test:v123:care-assist-safety
```
