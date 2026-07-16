# Ultrasound Specialty Workspaces

The existing `ObUltrasound` record remains the shared authoritative scan model. v1.5.0 adds draft → complete for review → reviewed → signed → amended lifecycle values and clinician-only review/sign/amend services. Review requires patient, active encounter, context, date, operator, scan type, and meaningful findings; signing additionally requires a doctor-authored impression.

The server-paginated center filters REAL records by queue, patient/MRN, context, date, operator, and status. GYN/fertility entry stores structured uterus, endometrium, ovaries, individually validated follicle measurements, and stable lesion IDs in the existing structured findings field. It performs no autonomous interpretation. Secure image/report visual QA remains outstanding.
