# Reception Demo Script

V0.1 reception workflow is for local demo only. Use fake/demo patient details.

## Login

- Email: `demo.reception@prij.local`
- Password: `LocalDev123!`

## Front Desk Flow

1. Open Patients.
2. Search for an existing demo patient or create a New Patient File.
3. Open the patient file.
4. Book an appointment from New Appointment.
5. Check the patient in from Check In.
6. Open Queue and confirm the patient appears in today's queue.
7. If the role has billing permission in the demo policy, create invoice/payment from the patient file; otherwise verify finance actions are hidden or denied.

## Expected Denials

- Reception cannot access Owner Control Center.
- Reception cannot access Admin Appearance settings.
- Reception cannot sign encounters, prescriptions, or reports.
- Reception cannot approve AI drafts.

## Demo Limits

- Queue priority is an operational marker, not emergency triage.
- No real patient data or real payment details.
