# Reports and Investigations Design

## Purpose
This document defines the MVP design for investigations, report metadata, manual report upload/reference, doctor review, and future integrations. It covers laboratory, radiology, ultrasound, pathology, external PDFs/images, scanned documents, and patient-provided prior reports.

## Scope
MVP supports manual workflows:
- Doctor investigation requests.
- Investigation lifecycle tracking.
- Manual report upload or secure external reference.
- Report metadata storage.
- Doctor review and follow-up note.
- Permission-controlled view, download, export, correction, void, and deletion workflows.

MVP does not include direct lab, radiology, PACS/RIS, ultrasound device, pathology, cytology, pharmacy, insurance, or payment gateway integrations.

## Investigation Order Workflow
1. Doctor creates investigation order from an encounter.
2. Order records category, type, reason, priority, instructions, and requested timestamp.
3. Staff tracks status as work progresses.
4. Staff records result receipt metadata and links report files or references.
5. Doctor reviews the report or result metadata.
6. Doctor records review note or follow-up plan where needed.
7. Status changes and review actions are audit logged.

## Investigation Statuses
- `requested`
- `scheduled`
- `sample_collected`
- `sent_out`
- `result_pending`
- `result_received`
- `reviewed`
- `cancelled`
- `voided`

Voids require explicit permission and reason.

## Investigation Categories
- Laboratory.
- Radiology.
- Ultrasound.
- Pathology.
- Cytology.
- Procedure.
- External consultant.
- Other.

Priority values should remain operational, such as routine and urgent. The system must not present queue or investigation priority as emergency triage.

## Report Types

### Laboratory Reports
Used for lab result PDFs, images, or manual result metadata. MVP should store:
- Report title.
- Source.
- Received timestamp.
- Linked investigation order.
- Linked patient and encounter.
- Secure file reference where applicable.
- Review status and doctor review note.

### Radiology Reports
Used for imaging reports and external imaging summaries. MVP should store:
- Modality if known.
- Body site if needed.
- External study reference if available.
- Secure file reference or external reference.
- Doctor review status.

### Ultrasound Reports
Used for ultrasound report files or manually recorded report metadata. MVP should store:
- Ultrasound type if known.
- Source and receipt date.
- Linked encounter or investigation.
- Secure file reference.
- Doctor review status.

### Pathology and Cytology Reports
Used for pathology and cytology report files or references. MVP should store:
- Specimen type if known.
- External case reference if available.
- Source and receipt date.
- Secure file reference.
- Doctor review status.

### External Uploaded PDFs and Images
Used for scanned documents, patient-provided prior reports, external consultant letters, and outside results. MVP should store:
- File category.
- Original filename.
- MIME type.
- File size.
- Storage key.
- Hash if calculated.
- Source.
- Receipt date.
- Linked patient, encounter, and investigation where applicable.

## File Storage Requirements
- Report files must be stored outside the repository.
- Use private object storage or protected local storage depending on deployment.
- Never expose permanent public URLs.
- File access must go through application authorization.
- Download and export permissions are separate from view permission.
- Use a strict file type allowlist.
- Scan or validate file type where feasible.
- Store database metadata separately from file contents.
- Back up file storage separately from database if storage is external.

Recommended MVP allowlist:
- `application/pdf`
- `image/jpeg`
- `image/png`

Other formats require explicit approval.

## Report Review Workflow
1. Report metadata is created and linked to patient.
2. Report is marked pending doctor review.
3. Doctor opens report through permission-checked route.
4. Doctor records review decision and note.
5. Report status changes to reviewed.
6. Follow-up actions are added to encounter or patient timeline where appropriate.

Doctor review does not mean the system independently interpreted the report. It records that an authorized doctor reviewed it.

## Permissions
Recommended permissions:
- `investigation.read`
- `investigation.create`
- `investigation.update`
- `investigation.cancel`
- `investigation.review`
- `report.read`
- `report.upload`
- `report.update`
- `report.review`
- `report.export`
- `report.void`
- `report.delete`

Report delete should be exceptional. Prefer void/correction workflow.

## Audit Events
Required events:
- Investigation created.
- Investigation status changed.
- Investigation cancelled or voided.
- Report metadata created or updated.
- Report file uploaded.
- Report viewed.
- Report downloaded or exported.
- Report reviewed.
- Report corrected.
- Report voided or deleted.

Audit payloads should include IDs, statuses, category, and safe metadata. Do not duplicate full report contents.

## Consent Rules
Report storage and handling should respect patient consent status. If consent is missing, withdrawn, or overridden:
- UI should show the status clearly.
- Server should block or require authorized override for workflows that require consent.
- Overrides require reason and audit.
- Future external sharing and AI processing require separate consent decisions.

## Correction, Void, and Deletion
- Metadata correction is allowed with permission and audit log.
- File replacement should create a new file record or preserve replacement history.
- Void should be preferred when a report was attached incorrectly.
- Hard delete should be restricted to exceptional cases and must be audited.
- If hard delete is legally or operationally required, the system should retain a safe deletion audit event without retaining report contents.

## Patient Timeline
Patient timeline should show:
- Investigation requested.
- Status changes.
- Report received.
- Report reviewed.
- Follow-up linked to encounter or appointment.

Timeline visibility must respect the viewer's permissions.

## Future Integration Requirements
Before adding any direct integration:
- Define authentication method.
- Define authorization and branch scope.
- Define consent requirements.
- Define patient matching and duplicate handling.
- Define order/result mapping.
- Define conflict and reconciliation rules.
- Define failure handling and retry behavior.
- Define audit events.
- Define rollback or void behavior.
- Define vendor security review requirements.

Unmatched or conflicting external reports should require manual review before linking to a patient.
