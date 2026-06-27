# AI Safety Rules

## Current Status
AI features are not part of the first build phase. The MVP should work without AI.

When AI features are added later, they must be assistive, draft-only, and doctor-reviewed.

## Core Rule
AI must never replace the doctor. AI must not make autonomous diagnoses, prescribe independently, approve clinical records, or present itself as the final clinical authority.

No AI output may become part of a signed encounter, prescription, investigation interpretation, report review note, patient instruction, or follow-up plan until an authorized doctor explicitly reviews and approves it.

## Allowed Future AI Use Cases
Only after the core system, security model, and audit model are in place:
- Draft encounter note summaries from doctor-provided text.
- Draft patient instruction text for doctor review.
- Suggest billing or coding draft categories where legally appropriate and reviewed by staff.
- Summarize existing records for doctor review.
- Prepare draft follow-up reminders from approved encounter plans.
- Draft report summaries for doctor review from already-stored report metadata or approved extracted text.
- Draft administrative message text for staff review when consent and communication rules allow it.

## Prohibited AI Use Cases
- Autonomous diagnosis.
- Autonomous treatment plans.
- Autonomous prescriptions.
- Emergency triage decisions.
- Replacing doctor review.
- Writing final clinical records without approval.
- Approving, signing, correcting, or voiding clinical records.
- Interpreting investigations or reports as final clinical conclusions.
- Generating patient-facing medical instructions without doctor approval.
- Using AI output to bypass consent, RBAC, or audit logging.
- Training or testing with real patient data unless there is a formally approved privacy and consent process.

## Required AI Controls
Every AI-generated clinical draft must store:
- Draft status.
- Input source references.
- Model/provider identifier.
- Prompt or prompt version.
- Generated timestamp.
- Requesting user.
- Reviewing doctor.
- Approval, rejection, or edit status.
- Final approved text, if any.
- Link to the final clinical record update if approved text is used.
- Rejection or correction reason where applicable.

Allowed draft statuses should include draft, pending_doctor_review, doctor_edited, approved, rejected, expired, and voided.

## UI Requirements for AI Drafts
AI output must be visibly labeled:
- "AI draft"
- "Requires doctor review"
- "Not part of the final record until approved"

The UI must require an explicit doctor action before a draft becomes part of the clinical record.
Copying, inserting, or accepting AI draft text into a final record must be a deliberate doctor action, not an automatic background process.

AI drafts should not be visually mixed with final clinical content unless the draft label and approval state remain obvious.

## Data Minimization
- Send the minimum necessary context to any AI service.
- Do not include secrets or unrelated patient history.
- Do not use real patient examples in prompts, tests, fixtures, or documentation.
- Log metadata, not full sensitive prompt content, unless a secure approved audit design exists.
- Respect consent, RBAC, clinic/branch scope, and data-sharing rules before sending any patient context to an AI service.
- Prefer de-identified or summarized context where possible.
- Do not send report files, images, scans, or full clinical histories to an AI service until a specific consent, security, vendor, and audit design has been approved.

## Audit Requirements
Audit logs must capture:
- AI draft created.
- AI draft viewed.
- AI draft edited.
- AI draft approved.
- AI draft rejected.
- Final record updated from AI draft.
- AI draft expired or voided.
- Input source references used for draft generation.
- Doctor identity for approval and final insertion.

Audit summaries should avoid storing full prompts, full patient records, report contents, or generated clinical text unless a secure approved audit storage design exists.

## Demo Example
Use examples like:
- "Demo Patient A reports a demo symptom for documentation testing."

Do not use realistic full patient histories, real identifiers, phone numbers, addresses, scans, or lab reports.
