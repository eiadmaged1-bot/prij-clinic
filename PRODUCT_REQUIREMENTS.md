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
The MVP should include:
- Patient registration and profile.
- Appointment booking and doctor calendar.
- Queue management for walk-ins and scheduled patients.
- Encounter records with doctor-authored notes.
- Prescription records.
- Investigation requests and results tracking.
- Report upload/reference records.
- Billing, invoices, payment records, and balances.
- Roles and permissions.
- Audit logs for sensitive actions.
- Backup and restore process documentation.
- Basic security controls and environment configuration.

## Out of Scope for Initial Build
- AI diagnosis or treatment recommendations.
- Autonomous clinical decision-making.
- Patient-facing portal.
- Telemedicine.
- Insurance integrations.
- Pharmacy integrations.
- Laboratory integrations.
- Claims of regulatory compliance until reviewed by qualified legal/compliance experts.

## Core Workflows
### Appointment and Queue
1. Receptionist creates or finds a patient profile.
2. Receptionist books an appointment or adds the patient to today's queue.
3. Staff update queue status: waiting, with assistant, with doctor, completed, cancelled, no-show.
4. Doctor views today's calendar and queue.

### Encounter
1. Doctor opens the patient profile.
2. Doctor creates an encounter linked to the appointment or walk-in visit.
3. Doctor records complaint, history, examination notes, assessment, plan, prescriptions, investigations, and follow-up.
4. Every create, update, and delete action is audit logged.

### Billing
1. Staff creates an invoice for consultation, procedure, investigation, or other clinic service.
2. Staff records payment method and amount.
3. System tracks paid, partially paid, refunded, and voided states.

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
