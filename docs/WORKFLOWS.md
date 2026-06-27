# Workflows

## Workflow Principles
- Staff must authenticate before accessing any clinic workflow.
- Authorization must be enforced by the server for every protected action.
- Use the minimum necessary patient information for each task.
- Clinical records, reports, billing changes, consent changes, exports, backups, and admin actions must be audit logged.
- AI is not part of MVP workflows. Future AI output remains draft-only until doctor approval.

## Patient Registration and Consent
1. Receptionist searches for an existing patient.
2. If no matching patient exists, receptionist creates a patient profile with minimum required demographics and contact details.
3. Receptionist records emergency contact details when available and appropriate.
4. Receptionist records consent statuses for treatment, communication, report storage, and future data sharing where applicable.
5. The system displays missing, withdrawn, or overridden consent before report handling, communication, or future AI processing.
6. Consent changes, withdrawals, and overrides require an audit log. Overrides require a reason.

MVP controls:
- No real patient data in development, tests, screenshots, or seed data.
- Profile creation and updates are permission-controlled.
- Sensitive profile access should be auditable.

## Appointments
1. Receptionist finds or creates a patient profile.
2. Receptionist selects doctor, date, time, duration, and appointment reason summary.
3. System warns about scheduling conflicts.
4. Appointment can move through booked, rescheduled, cancelled, completed, or no-show states.
5. Doctor calendar and queue reflect the current appointment status.

MVP controls:
- Rescheduling should preserve history.
- Cancellation and no-show updates should be auditable where clinic policy requires.
- Calendar views are filtered by role, doctor assignment, clinic, and branch scope.

## Queue
1. Receptionist or assistant adds scheduled patients and walk-ins to today's queue.
2. Queue entry is linked to patient, appointment if applicable, doctor if assigned, and queue date.
3. Staff update status through checked in, waiting, with assistant, ready for doctor, with doctor, completed, cancelled, or no-show.
4. Assistant or nurse records permitted preparation details.
5. Doctor opens the queue item to start or continue the encounter.

MVP controls:
- Queue priority is an operational marker, not emergency triage.
- Assistant notes must remain separate from doctor-authored encounter notes.
- Queue edits are role-limited and audit-aware.

## Doctor Calendar
1. Doctor opens daily or weekly calendar.
2. Calendar shows authorized appointments and queue state.
3. Doctor can filter by date, status, and assigned doctor where permitted.
4. Doctor opens the patient profile or encounter from the calendar or queue.

MVP controls:
- Doctors should not see unauthorized branch or doctor schedules unless granted.
- Calendar must not expose more patient details than needed for scheduling and care.

## Patient Profile
1. Authorized user opens patient profile.
2. System shows demographics, consent status, and permitted timeline items.
3. Timeline includes appointments, encounters, prescriptions, investigations, reports, invoices, payments, and follow-up items according to permissions.
4. Sensitive tabs or exports require separate permissions.

MVP controls:
- Profile view should minimize sensitive detail by default.
- Report view/export and billing view/export are separate permissions.
- Sensitive read audit should cover profile sections that expose clinical or report detail.

## Encounters
1. Doctor opens patient profile from appointment, queue, or search.
2. Doctor creates an encounter linked to appointment or walk-in queue entry.
3. Doctor records complaint, history, examination, assessment, plan, prescriptions, investigations, reports referenced, and follow-up.
4. Doctor reviews any assistant or nurse preparation notes.
5. Doctor signs or finalizes the encounter when complete.
6. Corrections after signing are versioned or appended with a reason.

MVP controls:
- Only authorized doctors can sign encounters.
- Signed encounters cannot be silently overwritten.
- Create, update, sign, correction, void, and export actions are audit logged.

## Prescriptions
1. Doctor creates prescription record from encounter.
2. Doctor adds prescription items and instructions.
3. Doctor approves or finalizes the prescription.
4. Prescription may be cancelled, replaced, or voided with a reason.

MVP controls:
- No autonomous prescribing.
- Only authorized doctors approve prescriptions.
- Print/export is V1 unless formatting and access controls are defined for MVP.
- Prescription changes and voids are audit logged.

## Investigations
1. Doctor requests investigation from an encounter.
2. Request includes investigation type, category, reason, priority, and instructions.
3. Staff track status through requested, scheduled, sample collected, sent out, result pending, result received, reviewed, cancelled, or voided.
4. Result metadata is recorded when available.
5. Doctor reviews result or related report and records review status and follow-up note.

MVP controls:
- Lifecycle states should be explicit.
- Voids and cancellations require permissions; voids require a reason.
- Result metadata and reports are linked back to encounter and patient.

## Reports and External Files
1. Staff receives or references a report.
2. Staff records report type, category, source, receipt date, patient, investigation if applicable, encounter if applicable, and storage reference.
3. Report file is uploaded to secure storage or referenced externally. It is never committed to the repository.
4. Authorized users view the report through application access checks.
5. Doctor reviews report, records review note where needed, and marks it reviewed.
6. Report correction, void, deletion, download, and export actions require permissions and audit logs.

MVP report categories:
- Laboratory.
- Radiology and imaging.
- Ultrasound.
- Pathology.
- Cytology.
- Procedure reports.
- External consultant reports.
- External PDFs and images.
- Scanned documents.
- Patient-provided prior reports.

V2 direct integration candidates:
- Laboratory information systems.
- Radiology, PACS, and RIS.
- Ultrasound or diagnostic devices.
- Pathology and cytology systems.

Integration prerequisites:
- Authentication and authorization model.
- Consent requirements.
- Data mapping and validation.
- Reconciliation and duplicate handling.
- Error handling and rollback.
- Audit logging for receipt, update, review, export, and failure states.

## Billing and Payments
1. Staff creates invoice from appointment, encounter, service, procedure, investigation, or manual line item.
2. Staff issues invoice when ready.
3. Staff records payment method, amount, date, and reference note.
4. System tracks paid, partially paid, refunded, cancelled, and voided states.
5. Discounts, refunds, reversals, and voids require permission and reason.

MVP controls:
- Do not store card numbers, payment secrets, or unnecessary clinical details.
- Billing access is separate from clinical access where possible.
- Payment and adjustment actions are audit logged.

## Reports and Dashboard
1. Authorized staff view daily operational dashboard.
2. Dashboard shows appointments, queue load, completed visits, pending report reviews, invoices, payments, balances, and refunds.
3. Doctor views pending clinical review items relevant to their scope.
4. Admin or billing staff view billing summaries according to permissions.

MVP controls:
- Prefer aggregate information where detailed records are unnecessary.
- Exports require explicit permission and audit logs.
- Clinical dashboards must not imply diagnostic or treatment recommendations.

## Roles and Permissions
1. Admin creates users and assigns roles.
2. Roles grant explicit permissions.
3. Server checks permissions on every protected API action.
4. Permission changes are audit logged.
5. Branch or clinic scope limits data access where applicable.

MVP controls:
- UI hiding is not authorization.
- Admin users do not automatically bypass clinical privacy restrictions unless granted explicit permissions.
- Exceptional access, if added later, must require a reason and high-severity audit event.

## Audit Logs
1. Application records audit event for protected actions.
2. Audit event includes actor, action, resource type and ID, timestamp, safe request metadata, before/after summary where appropriate, reason where required, and severity.
3. Authorized auditor or admin reviews logs.
4. Normal users and admins cannot edit or erase audit logs through the application.

MVP coverage:
- Clinical creates, updates, signs, corrections, voids, deletes, reads where sensitive, and exports.
- Consent creates, updates, withdrawals, overrides.
- Report uploads, views, downloads, exports, reviews, corrections, voids, deletions.
- Billing invoices, payments, refunds, reversals, discounts, cancellations, voids.
- User, role, permission, session-risk, backup, restore, and configuration changes.

## Backups and Restore Tests
1. System runs database backup on documented schedule.
2. System backs up report file/object storage if uploaded files are enabled.
3. Backup metadata is recorded without storing backup files in the repository.
4. Authorized admin or system owner performs restore test on a safe environment.
5. Restore test verifies clinical records, consent records, audit logs, RBAC data, billing records, report metadata, and report files or references.
6. Restore test result and issues are recorded.

MVP controls:
- Backups must be encrypted and access-controlled before real clinic use.
- Restore tests are required before production use and repeated regularly.

## Security Operations
1. All access requires authentication.
2. Passwords are stored as hashes only.
3. Sessions expire and repeated failed login attempts are throttled or locked.
4. Real secrets are stored outside the repository.
5. Logs avoid full patient records, clinical notes, report contents, passwords, tokens, and payment secrets.
6. Deployed environments use encrypted transport.

MVP controls:
- `.env.example` contains placeholders only.
- Report file URLs must not bypass application authorization.
- Export actions are separately permission-controlled and audited.

## Future AI Draft Workflow
1. Authorized user requests an AI draft only after AI is approved for a later phase.
2. System sends minimum necessary context and records input source references.
3. AI output is stored as draft, pending doctor review.
4. UI labels output as "AI draft", "Requires doctor review", and "Not part of the final record until approved".
5. Doctor reviews, edits, approves, rejects, expires, or voids the draft.
6. Approved text can be inserted into a final clinical record only through explicit doctor action.
7. Final record update links back to the AI draft and writes an audit event.

Prohibited:
- Autonomous diagnosis.
- Autonomous treatment plans.
- Autonomous prescriptions.
- Final clinical interpretations without doctor approval.
- Using AI to bypass consent, RBAC, or audit logging.
