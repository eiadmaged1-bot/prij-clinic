# Clinical Smart Tags

v1.3.9 adds searchable clinical tags as structured data:

- `ClinicalTagDefinition` stores tag code, label, aliases, category, and active status.
- `PatientClinicalTag` stores patient tag instances with source type, source id, notes, creator, and audit context.
- Tags are idempotent per patient/source/tag where possible.

Initial tags include D&C, mastectomy, previous CS, CS, NVD, miscarriage/abortion, ectopic, molar pregnancy, IUFD/stillbirth, myomectomy, hysteroscopy, laparoscopy, ovarian cystectomy, hysterectomy, cervical cerclage, appendectomy, cholecystectomy, bariatric surgery, diabetes, hypertension, thyroid disease, asthma, anemia, PCOS, endometriosis, recurrent abortion, ICSI, IUI, and ovulation induction.

Smart Clinical Search is available to Owner/Admin/Doctor by backend permission. Receptionist and Accountant are not granted cohort search access by default.
