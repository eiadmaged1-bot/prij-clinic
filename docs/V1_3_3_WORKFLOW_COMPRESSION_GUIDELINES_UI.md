# v1.3.3 Workflow Compression + Guideline Import Fix

v1.3.3 fixes workflow compression and guideline actual import after v1.3.2 real-device QA. It is a polish and compression sprint, not a new-feature sprint.

## Scope

- Guideline Library official import now has a built-in source pack and clear import statuses.
- PDFs are stored only in gitignored private guideline storage.
- No paywall bypass, login-only scraping, or committed imported PDFs.
- Mobile navigation is grouped and compressed by role.
- Receptionist is cockpit-only.
- Patient file uses header, primary actions, tabs, and contextual workspaces.
- Today's Desk and Queue Board are compact boards.
- Logout remains visible through account/drawer controls.
- RBAC, audit logging, PHI/PII protection, document safety, backup readiness, local same-PC access, and Tailscale mobile access remain in scope.

## Safety

External AI remains disabled by default. AI output stays draft-only and doctor-reviewed. The system does not autonomously diagnose, prescribe, dose, rank treatment, or finalize clinical records.
