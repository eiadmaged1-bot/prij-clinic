# MVP Database Schema Design

## Purpose
This document defines the recommended MVP database schema for Prij Clinic. It is a design target for implementation and should be reviewed before migrations are created.

## Global Conventions
- Primary keys: `id uuid primary key`.
- Timestamps: `created_at`, `updated_at`.
- User tracking: `created_by_user_id`, `updated_by_user_id` where useful.
- Lifecycle records use `status` instead of hard delete.
- Sensitive records use `voided_at`, `voided_by_user_id`, and `void_reason` where voiding is allowed.
- Clinical corrections must be versioned or appended, not silently overwritten.
- Branch-scoped tables include `branch_id` where operationally relevant.
- Audit logs are append-only through normal application workflows.
- Report files, backups, and secrets are not stored in the repository.

## Enum Standards

### User Status
`active`, `invited`, `suspended`, `disabled`

### Appointment Status
`booked`, `rescheduled`, `cancelled`, `completed`, `no_show`

### Queue Status
`checked_in`, `waiting`, `with_assistant`, `ready_for_doctor`, `with_doctor`, `completed`, `cancelled`, `no_show`

### Encounter Status
`draft`, `signed`, `corrected`, `voided`

### Prescription Status
`draft`, `approved`, `cancelled`, `replaced`, `voided`

### Investigation Status
`requested`, `scheduled`, `sample_collected`, `sent_out`, `result_pending`, `result_received`, `reviewed`, `cancelled`, `voided`

### Report Category
`laboratory`, `radiology`, `ultrasound`, `pathology`, `cytology`, `procedure`, `external_consultant`, `scanned_document`, `patient_provided_prior_report`, `other`

### Billing Status
`draft`, `issued`, `paid`, `partially_paid`, `refunded`, `cancelled`, `voided`

### Payment Status
`recorded`, `reversed`, `refunded`, `voided`

### AI Draft Status
`draft`, `pending_doctor_review`, `doctor_edited`, `approved`, `rejected`, `expired`, `voided`

## Identity and Access

### users
- `id uuid primary key`
- `branch_id uuid null references branches(id)`
- `full_name text not null`
- `email text unique not null`
- `phone text null`
- `password_hash text not null`
- `status text not null`
- `mfa_enabled boolean not null default false`
- `mfa_secret_ref text null`
- `last_login_at timestamptz null`
- `failed_login_count integer not null default 0`
- `locked_until timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Notes:
- Store password hashes only.
- `mfa_secret_ref` must reference secure secret storage or encrypted application storage, not plaintext repository values.

### roles
- `id uuid primary key`
- `name text unique not null`
- `description text null`
- `is_system_role boolean not null default false`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### permissions
- `id uuid primary key`
- `key text unique not null`
- `description text null`
- `risk_level text not null default 'medium'`
- `created_at timestamptz not null`

### user_roles
- `user_id uuid references users(id)`
- `role_id uuid references roles(id)`
- `branch_id uuid null references branches(id)`
- `created_at timestamptz not null`
- `created_by_user_id uuid references users(id)`
- Primary key: `user_id`, `role_id`, `branch_id`

### role_permissions
- `role_id uuid references roles(id)`
- `permission_id uuid references permissions(id)`
- `created_at timestamptz not null`
- `created_by_user_id uuid references users(id)`
- Primary key: `role_id`, `permission_id`

## Clinic Structure

### branches
- `id uuid primary key`
- `name text not null`
- `code text unique not null`
- `address_summary text null`
- `phone text null`
- `status text not null default 'active'`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

## Patients and Consent

### patients
- `id uuid primary key`
- `branch_id uuid references branches(id)`
- `display_name text not null`
- `date_of_birth date null`
- `sex_at_birth text null`
- `phone text null`
- `email text null`
- `address_summary text null`
- `emergency_contact_name text null`
- `emergency_contact_phone text null`
- `status text not null default 'active'`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `created_by_user_id uuid references users(id)`
- `updated_by_user_id uuid references users(id)`

Development notes:
- Use fake/demo records only.
- Do not seed real patient identifiers.

### patient_consents
- `id uuid primary key`
- `patient_id uuid not null references patients(id)`
- `consent_type text not null`
- `status text not null`
- `recorded_at timestamptz not null`
- `recorded_by_user_id uuid not null references users(id)`
- `withdrawn_at timestamptz null`
- `withdrawn_by_user_id uuid null references users(id)`
- `overridden_at timestamptz null`
- `overridden_by_user_id uuid null references users(id)`
- `override_reason text null`
- `source text null`
- `notes text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Consent types should include treatment, communication, report storage, and future data sharing or AI processing if approved later.

## Appointments and Queue

### appointments
- `id uuid primary key`
- `branch_id uuid not null references branches(id)`
- `patient_id uuid not null references patients(id)`
- `doctor_user_id uuid not null references users(id)`
- `scheduled_start_at timestamptz not null`
- `scheduled_end_at timestamptz not null`
- `status text not null`
- `reason_summary text null`
- `cancellation_reason text null`
- `rescheduled_from_appointment_id uuid null references appointments(id)`
- `created_by_user_id uuid not null references users(id)`
- `updated_by_user_id uuid null references users(id)`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### queue_entries
- `id uuid primary key`
- `branch_id uuid not null references branches(id)`
- `patient_id uuid not null references patients(id)`
- `appointment_id uuid null references appointments(id)`
- `doctor_user_id uuid null references users(id)`
- `queue_date date not null`
- `status text not null`
- `priority text not null default 'routine'`
- `arrival_type text not null`
- `checked_in_at timestamptz null`
- `with_assistant_at timestamptz null`
- `ready_for_doctor_at timestamptz null`
- `with_doctor_at timestamptz null`
- `completed_at timestamptz null`
- `cancelled_at timestamptz null`
- `created_by_user_id uuid not null references users(id)`
- `updated_by_user_id uuid null references users(id)`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Queue priority is operational only. It must not be represented as emergency triage.

## Encounters

### encounter_preparation_notes
- `id uuid primary key`
- `patient_id uuid not null references patients(id)`
- `appointment_id uuid null references appointments(id)`
- `queue_entry_id uuid null references queue_entries(id)`
- `encounter_id uuid null references encounters(id)`
- `recorded_by_user_id uuid not null references users(id)`
- `recorded_at timestamptz not null`
- `vitals_summary text null`
- `reason_summary text null`
- `preparation_note text null`
- `status text not null default 'active'`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Assistant or nurse preparation notes must remain distinct from doctor-authored encounter notes.

### encounters
- `id uuid primary key`
- `branch_id uuid not null references branches(id)`
- `patient_id uuid not null references patients(id)`
- `doctor_user_id uuid not null references users(id)`
- `appointment_id uuid null references appointments(id)`
- `queue_entry_id uuid null references queue_entries(id)`
- `encounter_date timestamptz not null`
- `chief_complaint text null`
- `history_note text null`
- `examination_note text null`
- `assessment_note text null`
- `plan_note text null`
- `follow_up_note text null`
- `status text not null`
- `signed_at timestamptz null`
- `signed_by_user_id uuid null references users(id)`
- `corrected_from_encounter_id uuid null references encounters(id)`
- `correction_reason text null`
- `voided_at timestamptz null`
- `voided_by_user_id uuid null references users(id)`
- `void_reason text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `created_by_user_id uuid not null references users(id)`
- `updated_by_user_id uuid null references users(id)`

Signed encounter corrections should create a new correction record or append a correction entry, with audit logs linking the records.

## Prescriptions

### prescriptions
- `id uuid primary key`
- `branch_id uuid not null references branches(id)`
- `patient_id uuid not null references patients(id)`
- `encounter_id uuid not null references encounters(id)`
- `doctor_user_id uuid not null references users(id)`
- `status text not null`
- `instructions text null`
- `approved_at timestamptz null`
- `approved_by_user_id uuid null references users(id)`
- `cancelled_at timestamptz null`
- `cancelled_by_user_id uuid null references users(id)`
- `cancellation_reason text null`
- `replaced_by_prescription_id uuid null references prescriptions(id)`
- `voided_at timestamptz null`
- `voided_by_user_id uuid null references users(id)`
- `void_reason text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Only authorized doctors may approve prescriptions.

### prescription_items
- `id uuid primary key`
- `prescription_id uuid not null references prescriptions(id)`
- `medication_name text not null`
- `dose text null`
- `frequency text null`
- `duration text null`
- `route text null`
- `notes text null`
- `sort_order integer not null default 0`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

## Investigations and Reports

### investigation_orders
- `id uuid primary key`
- `branch_id uuid not null references branches(id)`
- `patient_id uuid not null references patients(id)`
- `encounter_id uuid not null references encounters(id)`
- `requested_by_doctor_user_id uuid not null references users(id)`
- `investigation_type text not null`
- `category text not null`
- `reason text null`
- `priority text not null default 'routine'`
- `instructions text null`
- `status text not null`
- `requested_at timestamptz not null`
- `scheduled_at timestamptz null`
- `sample_collected_at timestamptz null`
- `sent_out_at timestamptz null`
- `result_received_at timestamptz null`
- `completed_at timestamptz null`
- `reviewed_at timestamptz null`
- `reviewed_by_doctor_user_id uuid null references users(id)`
- `review_note text null`
- `cancelled_at timestamptz null`
- `cancelled_by_user_id uuid null references users(id)`
- `cancellation_reason text null`
- `voided_at timestamptz null`
- `voided_by_user_id uuid null references users(id)`
- `void_reason text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### lab_reports
- `id uuid primary key`
- `report_file_id uuid null references external_files(id)`
- `investigation_order_id uuid null references investigation_orders(id)`
- `patient_id uuid not null references patients(id)`
- `encounter_id uuid null references encounters(id)`
- `title text not null`
- `source text null`
- `received_at timestamptz not null`
- `result_summary text null`
- `review_status text not null default 'pending_review'`
- `reviewed_by_doctor_user_id uuid null references users(id)`
- `reviewed_at timestamptz null`
- `review_note text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### radiology_reports
- Same common fields as `lab_reports`.
- Additional fields: `modality text null`, `body_site text null`, `external_study_reference text null`.

### ultrasound_reports
- Same common fields as `lab_reports`.
- Additional fields: `ultrasound_type text null`, `external_study_reference text null`.

### pathology_reports
- Same common fields as `lab_reports`.
- Additional fields: `specimen_type text null`, `external_case_reference text null`.

Report-specific tables allow each category to grow safely. Shared files are tracked in `external_files`.

### external_files
- `id uuid primary key`
- `branch_id uuid not null references branches(id)`
- `patient_id uuid not null references patients(id)`
- `encounter_id uuid null references encounters(id)`
- `investigation_order_id uuid null references investigation_orders(id)`
- `file_category text not null`
- `original_filename text not null`
- `mime_type text not null`
- `file_size_bytes bigint not null`
- `storage_provider text not null`
- `storage_key text not null`
- `sha256_hash text null`
- `external_reference text null`
- `source text null`
- `status text not null default 'active'`
- `uploaded_by_user_id uuid not null references users(id)`
- `uploaded_at timestamptz not null`
- `voided_at timestamptz null`
- `voided_by_user_id uuid null references users(id)`
- `void_reason text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Allowed file types should be a strict allowlist, initially PDF and common image formats only if approved. Direct unauthenticated object URLs are not allowed.

## Billing

### billing_invoices
- `id uuid primary key`
- `branch_id uuid not null references branches(id)`
- `patient_id uuid not null references patients(id)`
- `appointment_id uuid null references appointments(id)`
- `encounter_id uuid null references encounters(id)`
- `invoice_number text unique not null`
- `status text not null`
- `currency text not null`
- `subtotal_amount numeric(12,2) not null`
- `discount_amount numeric(12,2) not null default 0`
- `tax_amount numeric(12,2) not null default 0`
- `total_amount numeric(12,2) not null`
- `balance_amount numeric(12,2) not null`
- `issued_at timestamptz null`
- `voided_at timestamptz null`
- `voided_by_user_id uuid null references users(id)`
- `void_reason text null`
- `created_by_user_id uuid not null references users(id)`
- `updated_by_user_id uuid null references users(id)`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### billing_invoice_items
- `id uuid primary key`
- `invoice_id uuid not null references billing_invoices(id)`
- `service_code text null`
- `description text not null`
- `quantity numeric(10,2) not null`
- `unit_price numeric(12,2) not null`
- `discount_amount numeric(12,2) not null default 0`
- `total_price numeric(12,2) not null`
- `sort_order integer not null default 0`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### payments
- `id uuid primary key`
- `branch_id uuid not null references branches(id)`
- `invoice_id uuid not null references billing_invoices(id)`
- `patient_id uuid not null references patients(id)`
- `amount numeric(12,2) not null`
- `method text not null`
- `status text not null`
- `paid_at timestamptz not null`
- `received_by_user_id uuid not null references users(id)`
- `reference_note text null`
- `reversed_at timestamptz null`
- `reversed_by_user_id uuid null references users(id)`
- `reversal_reason text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Do not store card numbers, CVV values, payment secrets, or gateway tokens in MVP billing records.

## Audit, Backups, and AI Drafts

### audit_logs
- `id uuid primary key`
- `actor_user_id uuid null references users(id)`
- `action text not null`
- `resource_type text not null`
- `resource_id uuid null`
- `occurred_at timestamptz not null`
- `branch_id uuid null references branches(id)`
- `ip_address inet null`
- `user_agent text null`
- `before_summary jsonb null`
- `after_summary jsonb null`
- `reason text null`
- `severity text not null`
- `correlation_id uuid null`
- `request_id text null`

Audit summaries must not store full clinical note bodies, report contents, passwords, tokens, payment secrets, or full AI prompts unless a separate approved secure audit design exists.

### backup_runs
- `id uuid primary key`
- `started_at timestamptz not null`
- `completed_at timestamptz null`
- `status text not null`
- `backup_scope text not null`
- `storage_location_summary text not null`
- `encrypted boolean not null`
- `initiated_by_user_id uuid null references users(id)`
- `failure_reason text null`
- `notes text null`
- `created_at timestamptz not null`

### restore_tests
- `id uuid primary key`
- `backup_run_id uuid not null references backup_runs(id)`
- `tested_at timestamptz not null`
- `tested_by_user_id uuid not null references users(id)`
- `status text not null`
- `scope_verified text not null`
- `issues_found text null`
- `notes text null`
- `created_at timestamptz not null`

### ai_draft_artifacts
- `id uuid primary key`
- `branch_id uuid not null references branches(id)`
- `patient_id uuid not null references patients(id)`
- `encounter_id uuid null references encounters(id)`
- `draft_type text not null`
- `status text not null`
- `input_source_summary jsonb not null`
- `input_source_refs jsonb not null`
- `model_provider text not null`
- `model_name text not null`
- `model_version text null`
- `prompt_version text not null`
- `output_text text not null`
- `requested_by_user_id uuid not null references users(id)`
- `created_at timestamptz not null`
- `expires_at timestamptz null`
- `voided_at timestamptz null`
- `voided_by_user_id uuid null references users(id)`
- `void_reason text null`

AI artifacts are future-only and draft-only. They cannot sign records, approve prescriptions, override permissions, or diagnose independently.

### ai_doctor_review_decisions
- `id uuid primary key`
- `ai_draft_artifact_id uuid not null references ai_draft_artifacts(id)`
- `reviewing_doctor_user_id uuid not null references users(id)`
- `decision text not null`
- `decision_reason text null`
- `edited_output_text text null`
- `linked_final_resource_type text null`
- `linked_final_resource_id uuid null`
- `decided_at timestamptz not null`
- `created_at timestamptz not null`

Decisions should include approved, edited_and_approved, rejected, expired, and voided. Any final clinical record update from an AI draft must be explicit, doctor-approved, and audit logged.

## Recommended Indexes
- `users(email)`
- `patients(branch_id, display_name)`
- `patients(branch_id, phone)`
- `appointments(branch_id, scheduled_start_at)`
- `appointments(doctor_user_id, scheduled_start_at)`
- `queue_entries(branch_id, queue_date, status)`
- `encounters(patient_id, encounter_date desc)`
- `prescriptions(patient_id, created_at desc)`
- `investigation_orders(patient_id, status)`
- `external_files(patient_id, uploaded_at desc)`
- `billing_invoices(patient_id, created_at desc)`
- `payments(invoice_id)`
- `audit_logs(occurred_at desc)`
- `audit_logs(actor_user_id, occurred_at desc)`
- `audit_logs(resource_type, resource_id)`
- `ai_draft_artifacts(patient_id, created_at desc)`
