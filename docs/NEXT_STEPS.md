# Next Steps

The exact next recommended sprint after the operational clinic MVP leap is:

## MVP Release Candidate Polish + OB/GYN Depth Expansion

Goals:

- Polish the patient-file action forms into fuller workflow screens where needed.
- Add deeper OB/GYN recording flows without diagnostic automation.
- Add a backend patient timeline endpoint with permission-filtered aggregation.
- Add service catalog selection to billing forms for permitted billing roles.
- Add browser screenshot QA across all themes and mobile/desktop breakpoints.

## Admin Hardening Follow-Up

- Add role-by-role manual QA for the Admin Control Center.
- Add browser-level checks for login, admin service price edit, patient creation, and patient file open.
- Add visual regression screenshots for all themes across desktop and mobile.
- Decide whether the saved default theme should apply before login or only after staff sign-in.
- Add production policy design for admin correction workflows, retention, and audit tamper resistance.

## Security And Production-Readiness Hardening

- Add patient-to-doctor assignment or an explicit access model for doctor patient reads.
- Add exhaustive lower-role positive-path matrices for every route and state transition.
- Add production-grade audit retention, tamper-resistance, export review, and alerting controls.
- Add production consent enforcement design before enforcing real consent rules.
- Add secure PHI file storage implementation with encryption, access control, malware scanning, audit logging, and expiring links.
- Add production backup encryption, restore proof, runbooks, monitoring, MFA, and legal/privacy review.
- Keep AI disabled/mock-only until consent, provider privacy, RBAC, audit, and doctor-review controls are complete.

Do not start production deployment until patient assignment/access policy, consent enforcement, audit retention/tamper-resistance, backup/restore proof, monitoring, MFA, legal review, and secure PHI file storage are stronger.
