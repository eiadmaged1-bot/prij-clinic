# v1.3.8 Infertility + Investigations + Mobile Workflow Fixes

v1.3.8 adds `INFERTILITY` as a patient type, patient clinical phases, an infertility induction-of-ovulation workspace, organized investigation catalog browsing, and mobile workflow fixes.

Safety boundaries remain unchanged: no real patient data, no external AI calls, no automatic diagnosis, no automatic prescribing, no automatic dosing, and no automatic treatment plan. Clinical output remains doctor-written or doctor-reviewed.

Implemented areas:
- Infertility patient type with human labels.
- Clinical phases with active/current phase display.
- Infertility workspace for episodes, induction cycles, AMH, follicular monitoring, and E2 serial results.
- Organized investigations categories, templates, favorites, and high-priority/common section.
- Global language switcher and logout in the authenticated shell and mobile drawer footer.
- Fixed Arabic visit type labels.
- Reception-visible Not sexually active checkbox.
- Owner-only visit price audit endpoints hidden from non-owner roles.

v1.3.7 public login same-origin proxy behavior is preserved through `/api/backend/auth/*`.
