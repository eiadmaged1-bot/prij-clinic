# v0.18.1 Staging Browser QA Lock

v0.18.1 locks the v0.18.0 staging deployment package with browser-facing QA and final stabilization only.

This sprint does not add clinical product features. It verifies that required browser routes exist, normal UI avoids raw developer wording, and safety boundaries remain visible.

## Verification

```powershell
npm run test:v181:browser-qa-lock
```

The lock covers:

- Login, dashboard, clinic walkthrough, patient, reception, calendar, queue, doctor, prescription, investigation, billing, report, AI draft, and admin readiness routes.
- No raw JSON display, stack traces, Prisma/JWT/schema/RBAC wording, unsafe pregnancy wording, external AI enabled wording, or positive automatic diagnosis/prescribing/dosing wording in checked route pages.
- AI assistant and AI drafts remain disabled-external-AI, draft-only, and doctor-review oriented.
- Security readiness remains Owner/Admin oriented and avoids production-readiness claims.

## Safety Boundaries

- No real patient data.
- No external AI runtime calls.
- No autonomous diagnosis, prescribing, dosing, or treatment ranking.
- No fake clinical claims.
- No WhatsApp, DICOM/PACS, insurance/TPA, real payment gateway, full accounting ledger, or mobile app.
- AI output remains draft-only until reviewed and approved by a doctor.
- Clinical record changes must remain audit-log capable.

