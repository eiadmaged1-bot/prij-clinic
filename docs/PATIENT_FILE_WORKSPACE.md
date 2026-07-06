# Patient File Workspace

v1.3.3 redesigns Patient File into a compact workspace instead of a wall of repeated actions.

- Header: patient name, file number, age, phone, current pregnancy status when present, allergies/current medications, last visit, next appointment, small QR action, and relevant staff signatures.
- Primary actions: New Encounter, Prescription, Request Investigation, Book Follow-up, More.
- Tabs: Overview, Timeline, Visits, Prescriptions, Investigations, Ultrasound, Documents, Invoices, Consents.

Large inline action walls are removed from the default page. Appointment, invoice, prescription, investigation, consent, and document workflows should open through contextual tabs, drawers, modals, or focused pages instead of expanding giant forms by default.

Role visibility remains RBAC-driven: receptionist sees operational summary, doctors see clinical tabs, owner/admin sees authorized full workspace, and accountant sees billing surfaces only.

External AI remains disabled by default and cannot autonomously diagnose, prescribe, dose, rank treatment, or finalize clinical records.
