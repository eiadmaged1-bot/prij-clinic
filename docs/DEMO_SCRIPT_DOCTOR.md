# Doctor Demo Script

V0.1 doctor workflow is a controlled demo and does not implement clinical decision support.

## Login

- Email: `demo.doctor@prij.local`
- Password: `LocalDev123!`

## Visit Flow

1. Open Queue or a patient file.
2. Start Visit from the patient file.
3. Record doctor-authored:
   - Chief complaint
   - History
   - Examination
   - Assessment
   - Plan
4. Save the draft visit note.
5. Sign Visit only after manual review.
6. Add Prescription manually.
7. Order Lab / Radiology manually.
8. Create Report metadata or Create Ultrasound Draft where permitted.
9. Review the patient Timeline tab.

## Clinical Safety

- No automatic diagnosis.
- No autonomous prescription.
- No AI-generated final note.
- Ultrasound records are recording-only and do not diagnose FGR or any condition.
- Signed records must not be silently edited.
