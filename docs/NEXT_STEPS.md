# Next Steps

The exact next recommended sprint after the V0.1 premium demo is:

## V0.1 Pilot QA And Usability Hardening

Goals:

- Run role-by-role manual QA for Owner, Admin, Doctor, Nurse, Receptionist, and Accountant.
- Verify the premium UI on desktop, tablet, and mobile viewport widths.
- Add Playwright or equivalent page smoke checks for the main web routes.
- Improve form validation messages without adding new clinical features.
- Confirm every page keeps the "Demo/local only - no real patient data" boundary visible.
- Keep AI disabled/mock-only and doctor-review-only.
- Keep OB ultrasound informational only, with physician interpretation required.
- Capture screenshots for internal demo documentation using fake/demo data only.

## Security And Production-Readiness Hardening

- Add patient-to-doctor assignment or an explicit access model for doctor patient reads.
- Add exhaustive lower-role positive-path matrices for every route and state transition.
- Add production-grade audit retention, tamper-resistance, export review, and alerting controls.
- Add production consent enforcement design before enforcing real consent rules.
- Add secure PHI file storage implementation with encryption, access control, malware scanning, audit logging, and expiring links.
- Add production backup encryption, restore proof, runbooks, monitoring, MFA, and legal/privacy review.
- Keep AI disabled/mock-only until consent, provider privacy, RBAC, audit, and doctor-review controls are complete.

Do not start production deployment until patient assignment/access policy, consent enforcement, audit retention/tamper-resistance, backup/restore proof, monitoring, MFA, legal review, and secure PHI file storage are stronger.
