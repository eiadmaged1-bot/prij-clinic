# Owner Demo Script

V0.1 operational MVP is a local/private demo only. Do not enter real patient data, real payment details, real files, or production credentials.

## Login

- Open `http://localhost:3000/login`.
- Use local demo credentials only:
  - ID: `eyad`
  - Password: `eyad`

This credential is forbidden outside a local/private demo database.

## Owner Flow

1. Open Dashboard.
2. Use the top patient search in Clinic Portal theme to find a demo patient by name, MRN, or phone.
3. Open Patients -> New Patient File and create a fake demo patient.
4. Open the patient file.
5. Use patient-centered workflow actions:
   - New Appointment
   - Check In
   - Start Visit
   - Add Prescription
   - Order Lab / Radiology
   - Create Report
   - Create Pregnancy Episode
   - Record Antenatal Visit
   - Create Ultrasound Draft
   - Create Invoice
   - Record Payment
   - Add Consent
   - Add Attachment Placeholder
6. Open the Timeline tab and verify the patient journey is visible.
7. Open Admin -> Appearance and switch between available themes.
8. Open Admin -> Service Catalog and Prices to edit demo pricing.
9. Use override actions only with a reason.

## Safety Boundaries

- No production use.
- No real patient records.
- No real payment gateway.
- No real PHI upload.
- AI remains disabled/mock-only and cannot update final clinical records.
- Audit logs cannot be deleted from the normal UI.
