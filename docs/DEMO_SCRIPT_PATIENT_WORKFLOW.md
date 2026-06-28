# Patient Workflow Demo Script

This script demonstrates the operational MVP journey from reception through finance and audit. It is not production-ready and must use fake/demo data only.

## Setup

```powershell
npm run dev:stop
docker compose up -d postgres
npm run prisma:repair
npm run prisma:seed
npm run dev
```

## End-to-End Flow

1. Login as `eyad` / `eyad`.
2. Open Patients -> New Patient File.
3. Create a fake demo patient.
4. Open the patient file.
5. Use New Appointment.
6. Use Check In.
7. Use Start Visit.
8. Use Add Prescription.
9. Use Order Lab / Radiology.
10. Use Create Report.
11. Use Create Pregnancy Episode.
12. Use Record Antenatal Visit.
13. Use Create Ultrasound Draft.
14. Use Create Invoice.
15. Use Record Payment.
16. Use Add Consent.
17. Use AI Draft Placeholder only to show disabled/mock AI safety.
18. Open Timeline and confirm the journey is listed.

## Verification Commands

```powershell
npm run test:operational:mvp
npm run test:visual:qa
```

## Not Included

- Real payment gateway.
- Real file upload for PHI.
- Diagnostic AI.
- Production consent/legal enforcement.
- Production backup/monitoring/legal review.
