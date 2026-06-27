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
- `status` fields for lifecycle state instead of hard deletion for clinical, billing, and report records.
- `voided_at`, `voided_by_user_id`, and `void_reason` where void/correction workflows are needed.

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

Permission keys should cover patient consent, report upload/view/review/export, encounter signing/correction, prescription approval, billing adjustments, audit review, and backup management.

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
- withdrawn_at
- overridden_at
- override_reason
- source
- notes

Consent changes, withdrawals, and overrides must be audit logged.

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
- with_assistant_at
- ready_for_doctor_at
- with_doctor_at
- completed_at

Queue status examples: checked_in, waiting, with_assistant, ready_for_doctor, with_doctor, completed, cancelled, no_show.

### visit_preparation_notes
- id
- patient_id
- appointment_id
- queue_entry_id
- encounter_id
- recorded_by_user_id
- recorded_at
- vitals_summary
- reason_summary
- preparation_note
- status

Assistant/nurse prep notes must be role-limited and clearly separate from doctor-authored encounter notes.

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
- corrected_from_encounter_id
- correction_reason

Clinical note changes must be audit logged.
Signed encounter corrections should be versioned or appended rather than silently overwritten.

### prescriptions
- id
- patient_id
- encounter_id
- doctor_id
- status
- instructions
- approved_at
- approved_by_user_id
- cancelled_at
- cancelled_by_user_id
- cancellation_reason

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
- category
- reason
- priority
- status
- requested_at
- scheduled_at
- sample_collected_at
- sent_out_at
- result_received_at
- completed_at
- reviewed_at
- reviewed_by_doctor_id

Investigation statuses should support requested, scheduled, sample_collected, sent_out, result_pending, result_received, reviewed, cancelled, and voided.

### reports
- id
- patient_id
- encounter_id
- investigation_id
- title
- report_type
- report_category
- file_storage_key
- external_reference
- source
- received_at
- status
- uploaded_by_user_id
- uploaded_at
- reviewed_by_doctor_id
- reviewed_at
- review_note
- voided_at
- voided_by_user_id
- void_reason

File contents must be stored in secure storage, not in the repository.
Report categories should include ultrasound, radiology_imaging, laboratory, pathology, cytology, procedure, external_consultant, scanned_document, and patient_provided_prior_report.
Report access, download/export, review, correction, void, and deletion must be permission-controlled and audit logged.

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
- voided_by_user_id
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

### billing_adjustments
- id
- invoice_id
- adjustment_type
- amount
- reason
- created_by_user_id
- created_at

Discounts, refunds, reversals, cancellations, and voids require permissions and audit logs.

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
- severity
- clinic_scope
- correlation_id

Audit logs should be append-only in normal application workflows.
Audit summaries should not store full clinical note bodies, report contents, secrets, tokens, or payment secrets.
Audit coverage should include clinical writes, sensitive reads/exports, report actions, consent changes, billing adjustments, user/role changes, backup runs, restore tests, and AI draft review events.

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
- approved_by_doctor_id
- rejected_reason
- created_at
- reviewed_at

AI drafts are for a later phase only and must never become final clinical records without doctor approval.
If approved text is copied into a final clinical record, the final record update must be audit logged and linked back to the draft.

## Backup Metadata
### backup_runs
- id
- started_at
- completed_at
- status
- storage_location_summary
- initiated_by_user_id
- restore_tested_at
- restore_tested_by_user_id
- backup_scope
- encrypted
- failure_reason
- notes

Do not store backup files in the repository.

### restore_tests
- id
- backup_run_id
- tested_at
- tested_by_user_id
- status
- scope_verified
- issues_found
- notes

Restore tests should verify database records, report file/object references, RBAC data, audit logs, consent records, and billing records.
