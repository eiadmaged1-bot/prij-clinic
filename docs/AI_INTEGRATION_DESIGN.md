# AI Integration Design

## Purpose
AI is not part of the first MVP build. This document defines the required future integration boundary so AI can be added later without weakening clinical safety, consent, RBAC, audit logging, or privacy.

## Core Rule
AI must assist only. It must never replace the doctor.

AI output is draft-only until an authorized doctor explicitly reviews and approves it. AI cannot diagnose independently, prescribe independently, sign records, finalize reports, approve investigations, override permissions, or bypass consent.

## Allowed Future Use Cases
Only after core workflows, RBAC, audit logging, backups, and consent controls are stable:
- Draft encounter note summaries from doctor-provided text.
- Draft patient instruction text for doctor review.
- Draft patient profile summaries for doctor review.
- Draft report summaries from approved report metadata or approved extracted text.
- Draft follow-up reminder text from doctor-approved plans.
- Draft administrative messages where communication consent allows it.

## Prohibited Use Cases
- Autonomous diagnosis.
- Autonomous treatment planning.
- Autonomous prescribing.
- Emergency triage decisions.
- Final clinical interpretation of reports.
- Signing or finalizing clinical records.
- Approving prescriptions.
- Overriding RBAC, branch scope, or consent.
- Using real patient data in prompts, tests, fixtures, or demos without a formally approved privacy and consent process.

## AI Service Boundary
Recommended future architecture:
- API receives draft request from authorized user.
- API checks RBAC, branch scope, patient scope, consent, and allowed draft type.
- API builds minimum necessary context from approved sources.
- AI service adapter sends request to provider or local model.
- API stores draft artifact with model and prompt metadata.
- Doctor reviews draft in application.
- Approved text is inserted into clinical record only through explicit doctor action.
- Audit events are written for draft create, view, review, and final insertion.

AI provider calls must be isolated behind an adapter so provider-specific behavior does not leak into clinical workflow code.

## Required Stored Metadata
Every AI draft artifact must store:
- Draft status.
- Draft type.
- Patient ID and optional encounter ID.
- Input source references.
- Input source summary.
- Model provider.
- Model name.
- Model version, if available.
- Prompt version.
- Generated output.
- Requesting user.
- Generated timestamp.
- Expiration timestamp where policy requires it.

Every doctor review decision must store:
- Draft artifact ID.
- Reviewing doctor.
- Decision.
- Edited output, if the doctor edited before approval.
- Rejection or correction reason where applicable.
- Linked final resource type and ID if inserted.
- Decision timestamp.

## Prompt and Input Handling
- Send the minimum necessary context.
- Prefer structured summaries over full records.
- Do not include unrelated patient history.
- Do not include secrets, tokens, internal credentials, payment secrets, or full report files.
- Do not send report images, scans, or full PDFs until specific consent, vendor, security, and audit design is approved.
- Store prompt version and input source references.
- Avoid storing full prompt content unless a separate encrypted prompt-retention policy is approved.

## Consent and Privacy
Before any AI request with patient context:
- Confirm the user has permission to request that draft type.
- Confirm the patient and branch are in scope.
- Confirm required consent exists for the specific AI workflow.
- Confirm no withdrawn consent blocks the workflow.
- Record blocked attempts when appropriate.

Future AI processing consent should be separate from general treatment consent unless clinic policy and legal review decide otherwise.

## Doctor Review Workflow
1. Authorized user requests AI draft.
2. System creates draft artifact with status `pending_doctor_review`.
3. UI labels the output as AI draft and not final.
4. Doctor reviews the draft.
5. Doctor chooses approve, edit and approve, reject, expire, or void.
6. If approved, doctor explicitly inserts text into an editable clinical record.
7. System writes audit events for the review and final record update.

No background job may automatically insert AI output into final clinical content.

## UI Labels
AI draft UI must clearly show:
- `AI draft`
- `Requires doctor review`
- `Not part of the final record until approved`

The final clinical record should show doctor-authored or doctor-approved content, with an internal link to the source AI draft for audit and review where appropriate.

## Permissions
Recommended permission keys:
- `ai_draft.request`
- `ai_draft.read`
- `ai_draft.review`
- `ai_draft.approve`
- `ai_draft.reject`
- `ai_draft.void`

Doctor approval should require both AI review permission and the relevant clinical permission for the target record.

## Audit Events
Required AI audit actions:
- `ai_draft.requested`
- `ai_draft.created`
- `ai_draft.viewed`
- `ai_draft.edited_by_doctor`
- `ai_draft.approved`
- `ai_draft.rejected`
- `ai_draft.expired`
- `ai_draft.voided`
- `ai_draft.inserted_into_record`
- `ai_draft.blocked_by_permission`
- `ai_draft.blocked_by_consent`

Audit summaries should include source references and statuses, not full prompts or unnecessary clinical text.

## Safety Validation
The server must reject AI operations that attempt to:
- Create final records.
- Sign encounters.
- Approve prescriptions.
- Mark report interpretations final.
- Override permissions.
- Override consent.
- Access records outside branch or doctor scope.

## Recommended Rollout
1. Keep AI disabled in MVP.
2. Add database tables for future readiness only if the team wants migration stability.
3. Before enabling AI, complete provider privacy review, consent policy, prompt policy, and clinical owner review.
4. Start with the lowest-risk draft type.
5. Audit every draft request and doctor decision.
