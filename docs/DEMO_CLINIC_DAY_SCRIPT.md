# Demo Clinic Day Script

## v0.14.1 QA Lock Pass

Use this pass for manual demo QA after automated checks are green. Use synthetic records only and clean up through supported safe status actions.

1. Open `/login` and sign in with an authorized local demo role.
2. Open `/dashboard` and confirm normal clinic navigation is visible.
3. Open `/patients/new` and create one synthetic patient.
4. Open `/patients/[id]` for that patient.
5. Confirm patient Doctor Visit, Gynecology, Pregnancy, Documents, Timeline, and Billing tabs are visible.
6. Open `/reception`, `/reception/today`, and `/reception/check-in`.
7. Check in the synthetic patient or confirm the handoff controls are present.
8. Open `/calendar` and `/appointments`.
9. Open `/queue` and confirm the queue view renders.
10. Open `/doctor/waiting` and confirm the doctor waiting list renders.
11. Start or resume Doctor Visit from the patient workspace.
12. Record only doctor-authored draft notes; do not expect automatic diagnosis, prescribing, dosing, FGR diagnosis, or final plan generation.
13. Open Gynecology and confirm templates are recording aids only.
14. Open Pregnancy, fetus/multiple pregnancy, antenatal, and ultrasound structured report areas.
15. Open Documents/Results timeline and Patient Timeline.
16. Open Billing and confirm service/invoice visit links remain billing-only and permission-aware.
17. Open `/admin`, `/admin/services`, `/admin/settings`, and `/admin/medication-safety-profiles` as Owner/Admin, then confirm denied roles cannot access protected pages.
18. Sweep visible UI text for raw JSON/code-like text and unsafe phrases.
19. Clean up the synthetic workflow only through supported safe status actions.

See `docs/V0_14_1_MANUAL_QA_CHECKLIST.md`.

## Earlier Clinic Day Script

Use synthetic records only. Clean up the synthetic patient after QA.

1. Log in with an authorized local demo role.
2. Create a synthetic patient.
3. Schedule an appointment.
4. Check in the patient from `/reception/today`.
5. Confirm the patient appears in `/queue`.
6. Open `/doctor/waiting`.
7. Start or resume the doctor visit from the patient workspace.
8. Add gynecology or pregnancy context.
9. Create a prescription draft without automatic dose.
10. Request investigations.
11. Add follow-up.
12. Create a service/invoice link if billing permissions are available.
13. Print the visit packet from the browser.
14. View the patient timeline.
15. Remove or archive the synthetic patient workflow records only through supported safe status actions.

Automated coverage:

```powershell
npm run test:v13:clinic-day-loop
```
