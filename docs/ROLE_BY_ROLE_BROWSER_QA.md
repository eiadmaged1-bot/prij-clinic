# Role-by-Role Browser QA

Use fake/demo data only. Do not enter real patient data, real payment details, secrets, or uploaded clinical files.

## Owner/Admin

- Open `/dashboard`.
- Open `/admin`.
- Open `/admin/services`.
- Open `/reports`.
- Open `/admin/security-readiness`.
- Open `/admin/medication-safety-profiles`.
- Open `/ai-assistant` and confirm AI remains draft-only and doctor-review oriented.
- Confirm no normal page shows raw JSON, stack traces, Prisma/JWT/schema/RBAC wording, or production-ready medical claims.

## Doctor

- Open patient workspace from `/patients`.
- Open `/doctor/waiting`.
- Open `/doctor/visit`.
- Open `/prescriptions`.
- Open `/investigations`.
- Check gynecology, pregnancy, and ultrasound surfaces from the patient workspace.
- Open `/ai-assistant` and `/ai-drafts`; confirm tools are draft-only, doctor-reviewed, and do not diagnose, prescribe, dose, or write final records automatically.

## Receptionist

- Open `/patients/new`.
- Open `/reception`.
- Open `/reception/check-in`.
- Open `/queue`.
- Open `/calendar`.
- Confirm receptionist workflows stay operational and do not expose clinical AI review or admin safety tools.

## Accountant

- Open `/billing`.
- Review manual payments where allowed.
- Open `/reports` where allowed by role.
- Confirm accountant access is blocked from clinical AI review, medication safety admin, and admin clinical safety tools.

## Pass Criteria

- Required pages load in the browser.
- Navigation reaches the role's normal daily workflow.
- Disallowed role surfaces are blocked or hidden.
- No real patient data is used.
- No unsafe clinical automation wording or external AI enabled wording appears.

