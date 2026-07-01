# v0.9.7 Reference Data Restore + Prescription Trial Readiness

Branch: `data/v0.9.7-reference-data-restore-prescription-readiness`

This sprint prepares the local demo database for manual browser QA after the v0.9.6 cleanup. It keeps demo/test/local patient data cleaned, discovers prior official medication exports, restores only approved official medication reference metadata, verifies guideline/protocol metadata, and proves role and prescription reference readiness.

Safety boundaries:
- No real patient data.
- No fake official medication rows.
- No blind verification of imported medication rows.
- Market strength/form remains reference metadata only, not patient dosing.
- Doctor directions remain manually authored.
- No stock, checkout, retail order, external AI, or payment gateway behavior.

Primary local command:

```powershell
npm run db:v097:prepare-reference
```

Strict medication readiness requires official rows:

```powershell
$env:APP_ENV="local"
npm run medication:v097:restore:apply
npm run medication:v097:ready-check:strict
```

Manual browser QA should wait until the v0.9.7 readiness checks pass or documented warnings are accepted by the owner.
