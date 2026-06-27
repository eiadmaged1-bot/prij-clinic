# Database Model

## Model Goals
The database must support clinic operations, privacy, role-based access control, auditability, and future doctor-approved AI drafts.

This is a first draft. Field names and constraints should be refined when the application stack is chosen.

## Global Conventions
Most tables should include:
- `id`
- `created_at`
- `updated_at`
- `created_by_user_id`
- `updated_by_user_id`

Sensitive tables should also support:
- `deleted_at` for soft delete where appropriate.
- Audit log entries for create, update, delete, view/export where required.
- Clinic or branch scope if multiple branches are supported.

## Identity and Access
### users
- id
- full_name
- email
- phone
- password_hash
- status
- last_login_at

### roles
- id
- name
- description

### permissions
- id
- key
- description

### user_roles
- user_id
- role_id

### role_permissions
- role_id
- permission_id

## Clinic Operations
### patients
- id
- display_name
- date_of_birth
- sex_at_birth
- phone
- email
- address_summary
- emergency_contact_name
- emergency_contact_phone
- status

Use demo-only examples in development, such as "Demo Patient A".

### patient_consents
- id
- patient_id
- consent_type
- status
- recorded_at
- recorded_by_user_id
- notes

### doctors
- id
- user_id
- specialty
- license_reference
- status

Do not store sensitive license documents in code or seed files.

### appointments
- id
- patient_id
- doctor_id
- scheduled_start_at
- scheduled_end_at
- status
- reason_summary
- created_by_user_id

### queue_entries
- id
- patient_id
- appointment_id
- doctor_id
- queue_date
- status
- priority
- checked_in_at
- completed_at

## Clinical Records
### encounters
- id
- patient_id
- doctor_id
- appointment_id
- encounter_date
- chief_complaint
- history_note
- examination_note
- assessment_note
- plan_note
- follow_up_note
- status
- signed_at
- signed_by_user_id

Clinical note changes must be audit logged.

### prescriptions
- id
- patient_id
- encounter_id
- doctor_id
- status
- instructions
- approved_at
- approved_by_user_id

### prescription_items
- id
- prescription_id
- medication_name
- dose
- frequency
- duration
- route
- notes

### investigations
- id
- patient_id
- encounter_id
- requested_by_doctor_id
- investigation_type
- reason
- status
- requested_at
- completed_at

### reports
- id
- patient_id
- encounter_id
- investigation_id
- title
- report_type
- file_storage_key
- source
- status
- uploaded_by_user_id
- uploaded_at

File contents must be stored in secure storage, not in the repository.

## Billing
### invoices
- id
- patient_id
- appointment_id
- status
- subtotal_amount
- discount_amount
- tax_amount
- total_amount
- issued_at
- voided_at
- void_reason

### invoice_items
- id
- invoice_id
- description
- quantity
- unit_price
- total_price

### payments
- id
- invoice_id
- patient_id
- amount
- method
- status
- paid_at
- received_by_user_id
- reference_note

Do not store card numbers or payment secrets.

## Audit and Safety
### audit_logs
- id
- actor_user_id
- action
- resource_type
- resource_id
- occurred_at
- ip_address
- user_agent
- before_summary
- after_summary
- reason

Audit logs should be append-only in normal application workflows.

### ai_drafts
- id
- patient_id
- encounter_id
- draft_type
- input_reference_summary
- output_text
- model_identifier
- prompt_version
- status
- requested_by_user_id
- reviewed_by_user_id
- created_at
- reviewed_at

AI drafts are for a later phase only and must never become final clinical records without doctor approval.

## Backup Metadata
### backup_runs
- id
- started_at
- completed_at
- status
- storage_location_summary
- initiated_by_user_id
- restore_tested_at
- notes

Do not store backup files in the repository.
