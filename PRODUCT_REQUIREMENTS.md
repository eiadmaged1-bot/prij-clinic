# Prij Clinic Product Requirements

## Purpose
Prij Clinic is a clinic management system for OB/GYN and women's health clinics. The first version must support safe daily clinic operations before any AI-assisted clinical drafting is introduced.

The product must help clinic staff manage appointments, queue flow, patient profiles, encounters, prescriptions, investigations, reports, billing, payments, roles, permissions, audit logs, backups, and security.

## Safety Principles
- Use fake/demo data only in examples, tests, seeds, and documentation.
- Do not store secrets, passwords, API keys, tokens, or patient data in code.
- AI must assist only and must never replace a doctor.
- Any AI clinical output must remain draft-only until reviewed and approved by a licensed doctor.
- All clinical record changes must be auditable.
- Security, RBAC, consent, privacy, backups, and recovery must be designed from the start.

## Users
- Receptionist: registers patients, manages appointments, updates queue status, records payments.
- Doctor: views schedule, reviews patient profile, records encounters, approves clinical notes, creates prescriptions and investigation requests.
- Nurse or assistant: supports queue, vitals, preparation notes, and follow-up tasks where permitted.
- Billing staff: creates invoices, records payments, tracks balances.
- Clinic admin: manages users, roles, permissions, clinic settings, backups, and audit review.
- System owner: maintains infrastructure, security posture, and compliance controls.

## MVP Scope
The MVP is an internal staff system for running daily clinic operations safely. It should include:
- Patient registration, demographics, contact details, emergency contact, consent status, and profile timeline.
- Appointment booking, rescheduling, cancellation, no-show tracking, and doctor calendar views.
- Queue management for scheduled visits and walk-ins, including check-in, assistant/nurse preparation, doctor rooming, completion, cancellation, and no-show states.
- Encounter records with doctor-authored notes, vitals/prep notes where permitted, prescriptions, investigations, report references, follow-up plans, and signed/unsigned status.
- Prescription records created or approved by a doctor, with audit history and print/export deferred until formatting and access controls are defined.
- Investigation requests, sample/scan status tracking, result metadata, report receipt, doctor review status, and linkage back to encounters.
- Report upload/reference records for all supported clinical report types, with secure file storage design and database metadata only.
- Billing, invoices, service line items, discounts, payments, partial payments, refunds, voids, balances, and payment audit trail.
- Users, roles, permissions, server-side authorization, and branch/clinic scoping where applicable.
- Audit logs for clinical writes, sensitive reads/exports, billing changes, user/role changes, consent changes, and backup/restore operations.
- Backup, restore, and restore-test process documentation before any production use.
- Basic security controls, environment configuration, data minimization, and secret-free repository rules.

The MVP should not claim regulatory compliance, automated clinical safety, or production medical readiness until reviewed by qualified clinical, legal, and security experts.

## Out of Scope for Initial Build
- AI diagnosis or treatment recommendations.
- Autonomous clinical decision-making.
- Patient-facing portal.
- Telemedicine.
- Insurance integrations.
- Pharmacy integrations.
- Direct laboratory, imaging center, pathology, cytology, PACS/RIS, device, accounting, payment gateway, or pharmacy integrations.
- Automated ingestion from external report systems.
- Clinical decision support alerts beyond simple workflow/status validation.
- Claims of regulatory compliance until reviewed by qualified legal/compliance experts.

## Core Workflows
### Patient Intake and Consent
1. Receptionist searches for an existing patient before creating a new profile.
2. Receptionist records only the minimum necessary demographic and contact data.
3. Staff records consent status for treatment, communication, report storage, and any future data sharing workflows.
4. Consent creation, update, withdrawal, and override are audit logged.
5. If consent is missing or withdrawn, the system must make the limitation visible before clinical documentation, report handling, or communication actions.

### Appointment and Queue
1. Receptionist creates or finds a patient profile.
2. Receptionist books, reschedules, cancels, or marks no-show for appointments.
3. Receptionist or assistant adds scheduled patients and walk-ins to today's queue.
4. Staff update queue status: checked in, waiting, with assistant, ready for doctor, with doctor, completed, cancelled, no-show.
5. Doctor views today's calendar and queue, filtered to authorized doctors/clinics only.

### Assistant or Nurse Preparation
1. Assistant opens the queued visit only if permitted by role.
2. Assistant records permitted prep information such as vitals, visit reason summary, documents received, and rooming status.
3. Assistant notes must be clearly distinguished from doctor-authored encounter notes.
4. Doctor reviews relevant prep information during the encounter.

### Encounter
1. Doctor opens the patient profile.
2. Doctor creates an encounter linked to the appointment or walk-in visit.
3. Doctor records complaint, history, examination notes, assessment, plan, prescriptions, investigations, and follow-up.
4. Doctor signs or finalizes the encounter when complete.
5. Corrections after signing should be versioned or appended rather than silently overwritten.
6. Every create, update, void, correction, sign, and export action is audit logged.

### Investigations and Reports
1. Doctor requests an investigation from an encounter, including type, reason, priority, and instructions.
2. Staff tracks request status such as requested, scheduled, sample collected, sent out, result pending, result received, reviewed, cancelled, or voided.
3. Staff records result metadata and attaches or references report files only in secure storage, never in the repository.
4. Supported report categories include ultrasound, radiology/imaging, laboratory, pathology, cytology, procedure reports, external consultant reports, scanned documents, and patient-provided prior reports.
5. External integrations are later-phase work; the MVP should support manual upload/reference and review workflows.
6. Doctor reviews reports, records interpretation or follow-up plan, and marks review status.
7. Report receipt, view, update, download/export, review, and deletion/void actions are permission-controlled and audit logged.

### Prescriptions
1. Doctor creates a prescription linked to an encounter when needed.
2. Prescription status tracks draft, active/approved, cancelled, replaced, or voided.
3. Only authorized doctors may approve or finalize prescriptions.
4. Changes and voids require audit logging and, where appropriate, a reason.

### Billing
1. Staff creates an invoice for consultation, procedure, investigation, or other clinic service.
2. Staff records payment method and amount.
3. System tracks draft, issued, paid, partially paid, refunded, cancelled, and voided states.
4. Discounts, refunds, voids, and payment reversals require permissions and audit reasons.
5. Billing records must not store card numbers, payment secrets, or unnecessary clinical details.

### Follow-Up and Continuity
1. Doctor sets follow-up date, instructions, or next planned action.
2. Receptionist can schedule the follow-up appointment if authorized.
3. Patient profile timeline shows encounters, prescriptions, investigations, reports, invoices, and follow-up items according to the viewer's permissions.

### Admin, Security, and Backup Operations
1. Admin manages users, roles, permissions, clinic settings, and branch scopes.
2. User, role, permission, session-risk, export, and backup actions are audit logged.
3. Backup jobs run on a documented schedule with encrypted storage.
4. Restore tests are documented and recorded before production use and repeated regularly.
5. Admins can review audit logs without being able to alter or erase them through normal application workflows.

## Demo Data Rules
Allowed example names:
- Demo Patient A
- Demo Patient B
- Dr. Demo
- Demo Clinic Branch

Do not use real patient names, phone numbers, IDs, addresses, scans, reports, prescriptions, or clinical histories.

## Acceptance Criteria
- Documentation clearly defines MVP boundaries before implementation starts.
- Security and AI safety rules are explicit and visible.
- Database model supports audit logs, RBAC, and clinical review status.
- Environment examples contain placeholders only.
- No real patient data or secrets are committed.
