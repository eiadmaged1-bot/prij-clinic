# Demo Clinic Day Script

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
