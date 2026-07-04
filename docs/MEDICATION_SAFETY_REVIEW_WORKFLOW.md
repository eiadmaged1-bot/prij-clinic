# Medication Safety Review Workflow

1. Owner/Admin imports an owner-provided source file.
2. Preview validates rows, matches `genericName` to `MedicationGeneric`, maps invalid category `E` to `REVIEW_REQUIRED`, and reports warnings/errors without writing profile changes.
3. Commit writes accepted rows as `needs_review` and records an audit event.
4. Review queue lists profiles that need review.
5. Owner/Admin approves, rejects, or retires a profile with a reason.
6. Approval requires source metadata. Reviewer and reviewed time are saved by the server.
7. Doctor-facing prescription safety views show category badge, lactation badge, source metadata, review status, reviewer metadata when present, and review-required state when not approved.

This workflow does not populate real reviewed source data by itself. Real reviewed source population is a separate governed workstream.
