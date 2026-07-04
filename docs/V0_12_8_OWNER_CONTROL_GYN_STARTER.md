# v0.12.8 Owner Control Center + General Gynecology Starter

Branch: `feature/v0.12.8-owner-control-gyn-starter`

v0.12.8 combines Owner Control Center improvements with a General Gynecology Starter workflow.

Implemented:
- Owner Control Center shell with links for clinic settings, service catalog, appearance, medication safety source review, audit, system status, and feature flag placeholders.
- Owner/Admin protected service and price catalog controls.
- Reason-required, audited service price/status changes.
- Safe owner override actions where existing models support them: appointment cancel, invoice void, queue cancel, and patient archive. These are reason-required and do not hard-delete signed clinical records or audit logs.
- Focused patient workspace tabs: Summary, Doctor Visit, Gynecology, History, Prescriptions, Investigations, Billing, Documents, Medication Safety, and Timeline.
- General gynecology visit workspace and starter templates for AUB, pelvic pain, PCOS, fibroid/ovarian cyst, and contraception counseling.
- `npm run test:v128:owner-control-gyn` regression coverage.

Safety boundaries:
- Gynecology starter templates are recording-only.
- The app does not diagnose, prescribe, dose, rank treatments, recommend contraception, or choose medication.
- Doctor impression and plan are manually written by the clinician.
- Service prices are clinic billing settings only. They are not medication, investigation-reference, insurance, or payment-gateway prices.
- No WhatsApp, DICOM/PACS, insurance/TPA, full ledger, real payment gateway, external AI runtime calls, or real patient data are added.
- Real production use still requires security, privacy, legal, consent, backup, deployment, and clinical governance readiness.

Recommended verification:

```powershell
git diff --check
npm run prisma:generate
npm run prisma:migrate:deploy
npm run test:v125:clinic-usability-lock
npm run test:v126:med-safety-review
npm run test:v127:no-code-ui
npm run test:v128:owner-control-gyn
npm run typecheck
npm run build
npm run test:security:cors
npm run test:web:hydration-root
npm run test:v120:no-fake-ui
```

Next sprint should stabilize and browser-QA this combined sprint with fake/synthetic data only.
