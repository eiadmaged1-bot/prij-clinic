# AI Safety Rules

## Current Status
AI features are not part of the first build phase. The MVP should work without AI.

When AI features are added later, they must be assistive, draft-only, and doctor-reviewed.

## Core Rule
AI must never replace the doctor. AI must not make autonomous diagnoses, prescribe independently, approve clinical records, or present itself as the final clinical authority.

## Allowed Future AI Use Cases
Only after the core system, security model, and audit model are in place:
- Draft encounter note summaries from doctor-provided text.
- Draft patient instruction text for doctor review.
- Suggest billing or coding draft categories where legally appropriate and reviewed by staff.
- Summarize existing records for doctor review.
- Prepare draft follow-up reminders from approved encounter plans.

## Prohibited AI Use Cases
- Autonomous diagnosis.
- Autonomous treatment plans.
- Autonomous prescriptions.
- Emergency triage decisions.
- Replacing doctor review.
- Writing final clinical records without approval.
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

## UI Requirements for AI Drafts
AI output must be visibly labeled:
- "AI draft"
- "Requires doctor review"
- "Not part of the final record until approved"

The UI must require an explicit doctor action before a draft becomes part of the clinical record.

## Data Minimization
- Send the minimum necessary context to any AI service.
- Do not include secrets or unrelated patient history.
- Do not use real patient examples in prompts, tests, fixtures, or documentation.
- Log metadata, not full sensitive prompt content, unless a secure approved audit design exists.

## Audit Requirements
Audit logs must capture:
- AI draft created.
- AI draft viewed.
- AI draft edited.
- AI draft approved.
- AI draft rejected.
- Final record updated from AI draft.

## Demo Example
Use examples like:
- "Demo Patient A reports a demo symptom for documentation testing."

Do not use realistic full patient histories, real identifiers, phone numbers, addresses, scans, or lab reports.
