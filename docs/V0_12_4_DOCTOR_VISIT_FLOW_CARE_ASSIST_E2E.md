# v0.12.4 Doctor Visit Flow + Care Assist E2E

v0.12.4 connects the existing patient file, v0.12.2 history sheet, v0.12.3 Care Assist, medication safety profiles, generic medication search, prescriptions, investigation requests, follow-up tasks, and print packet into a guided doctor visit workflow.

The workflow is doctor-led. Care Assist is completeness and safety review only. Clinical hints are side-panel notes only. The app does not autonomously diagnose, prescribe, rank treatment, sign records, or auto-fill dose/frequency/duration.

Checks:

```powershell
npm run prisma:generate
npm run test:v124:doctor-visit-flow
npm run test:v124:clinical-safety-wording
npm run typecheck
npm run build
```

Remaining limitation: real reviewed pregnancy/lactation profile source content is still needed before clinical reliance.
