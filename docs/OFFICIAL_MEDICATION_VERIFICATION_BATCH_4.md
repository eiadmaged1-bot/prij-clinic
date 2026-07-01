# Official Medication Verification Batch 4

Batch 4 verified additional high-confidence Bahrain NHRA and Oman MOH official medication rows.

Before batch 4:
- Total real official rows: 8,269.
- Bahrain rows: 3,169.
- Oman rows: 5,100.
- Verified rows: 600.
- Bahrain verified rows: 300.
- Oman verified rows: 300.
- Open review items: 7,669.
- High-confidence candidates remaining: 7,598.
- Low-confidence blocked Oman rows: 71.
- Demo rows excluded: 23.

Batch commands:

```powershell
npm run medication:bahrain:verify:batch -- --limit 300 --reason "Official NHRA high-confidence verification batch 4"
npm run medication:oman:verify:batch -- --limit 300 --reason "Official Oman MOH high-confidence verification batch 4"
```

After batch 4:
- Total real official rows: 8,269.
- Bahrain rows: 3,169.
- Oman rows: 5,100.
- Verified rows: 1,200.
- Bahrain verified rows: 600.
- Oman verified rows: 600.
- Open review items: 7,069.
- High-confidence candidates remaining: 6,998.
- Low-confidence blocked Oman rows: 71.
- Demo rows excluded: 23.

Verification rules preserved:
- Reason is required.
- Only high-confidence rows are verified.
- Low-confidence, incomplete, duplicate-risk, conflict, or unsafe metadata rows stay review-gated.
- Verified rows are not silently overwritten by imports or restores.
- Verification remains admin-only and audited.
- No patient dosing instructions, treatment plans, medication recommendations, automatic prescriptions, or self-medication guidance are generated.

Post-batch disaster recovery:
- Export verification passed.
- Restore drill passed against `prij_clinic_medication_restore_test`.
- Export files and restore reports remain ignored local artifacts.
