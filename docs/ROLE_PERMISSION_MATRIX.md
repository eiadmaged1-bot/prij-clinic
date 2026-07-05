# Role Permission Matrix

v0.16.0 uses this matrix as a readiness reference. It prepares the app for real patient data readiness review, but it is not a legal or production access-control certification.

| Role | Intended access | Explicit limits |
| --- | --- | --- |
| Owner | Full clinic administration, users, roles, services, audit, readiness, medication safety review, billing, and clinical oversight surfaces. | Must not bypass audit, consent, patient scope, or doctor review requirements. |
| Admin | Operational administration, staff setup, service catalog, readiness review, audit review, and governed medication safety review. | Must not replace doctor approval for clinical decisions. |
| Doctor | Patient care workspace, encounters, prescriptions, investigations, results, calculators, and doctor-reviewed AI draft surfaces. | No Owner/Admin security settings, user management, service pricing, or admin readiness settings. |
| Nurse | Clinical support surfaces where assigned permissions allow access. | No Owner/Admin security settings, medication source administration, or billing administration by default. |
| Receptionist | Registration, appointments, check-in, queue, reception today, and patient lookup needed for front-desk workflows. | No medication safety source review, advanced clinical/admin safety tools, billing administration, or Owner/Admin security settings. |
| Accountant | Billing, invoices, manual payment records, finance summaries, and reports where assigned. | No medication safety source review, advanced clinical/admin safety tools, reception queue management beyond assigned permissions, or Owner/Admin security settings. |

Backend readiness rules:

- Admin and readiness APIs must use `JwtAuthGuard` and `PermissionsGuard`.
- Owner/Admin settings use `clinic_settings.manage` or a narrower admin permission.
- Medication safety import and review uses `medication_safety_profile.manage`.
- Receptionist and Accountant roles must be blocked by backend guards, not only hidden in UI.
- Doctor roles must remain outside Owner/Admin security settings.
- Audit, patient scope, consent, PHI/PII, and draft-only AI protections must not be weakened by role changes.
