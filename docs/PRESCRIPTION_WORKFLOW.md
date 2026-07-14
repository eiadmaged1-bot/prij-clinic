# Prescription Workflow

v1.4.6 persists dose unit, PRN, and custom-entry reason through an additive migration. Catalog duplicates are blocked; distinct duplicates require confirmation. Tabs are `Templates | Saved meds | Recent`; printing remains doctor-review gated.

Clinical prescriptions begin from Patient File → active visit → Prescriptions. Patient and encounter context are locked. The standalone page manages templates and frequent medication shortcuts only.

Medication rows support catalog selection or explicit manual/unverified entry, compact editing, quantity/unit, directions, reordering, duplication, and removal. Printing requires a saved patient-linked draft and completed doctor review gates. Output uses a dedicated A5 route with no application chrome.
