# Prescription Medication Selection QA

Purpose: prove a prescription draft can reference restored medication metadata without generating patient directions.

Run:

```powershell
npm run prescriptions:v097:medication-selection-check
```

Expected behavior:
- The script logs in with the local `eyad` owner account.
- It creates a QA-prefixed fake patient only for the test.
- It selects a `verified` or `needs_review` official medication reference row.
- The prescription item stores reference display fields such as trade/generic/strength/form when present.
- Dose, frequency, duration, and instructions remain blank unless manually entered.
- The prescription remains draft/doctor-controlled and audited.

If no official medication rows exist, the script warns and skips instead of faking data.
