# v0.13.0-v0.14.0 Clinic Operations + Documents + OB/GYN Deepening Mega Sprint

This sprint intentionally skips the dedicated v0.12.9 QA sprint and makes one staged product leap. Manual browser QA is deferred to the user after this mega sprint.

Scope:
- Reception daily workspace, appointment calendar, queue, and doctor waiting handoff.
- Service and invoice link from the patient visit workspace using the existing Owner/Admin service catalog and billing model.
- Investigation order handoff, patient documents/results metadata timeline, and consolidated patient timeline.
- Pregnancy episode, fetus/multiple pregnancy starter, antenatal visit recording, and OB ultrasound structured report starter.
- Daily clinic summary cards and demo clinic day script.

Safety boundaries:
- Not production-ready.
- No real patient data.
- No WhatsApp, DICOM/PACS, insurance/TPA, external AI runtime calls, real payment gateway, mobile app, or full accounting ledger.
- No automatic diagnosis, prescribing, dosing, FGR diagnosis, anomaly interpretation, fetal image AI, or treatment ranking.
- AI remains doctor-assist and draft-only.
- Reviewed medication safety population remains a governed Owner/Admin workstream.

Verification scripts:

```powershell
npm run test:v13:clinic-day-loop
npm run test:v14:obgyn-deepening
npm run test:v14:no-unsafe-obgyn-automation
```
