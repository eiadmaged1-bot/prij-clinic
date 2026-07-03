# Medication Reference Readiness

v0.12.1 does not invent a medication database.

The readiness command reports:

- medication product rows
- official drug-market rows
- verified official rows
- needs-review official rows
- source systems present
- import runs
- open review queue count

Run:

```powershell
npm run db:v121:medications:ready
```

If official rows are zero, the command reports a warning. That warning is the expected honest state until approved official files or a verified prior export are imported. No fake medication products, dosing, frequency, duration, route, patient instructions, AI diagnosis, AI prescribing, stock, cart, checkout, or purchase workflow is added.

Medication data remains reference metadata only and doctor review remains mandatory.
