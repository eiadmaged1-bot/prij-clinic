# Feature 46 — Refractory Complaint Status

## Controlled Codex Test

Target branch: `test/feature-46-refractory-complaint`

Goal: implement only the new complaint lifecycle status `Refractory` in the current Prij Clinic application.

## Hard limits

- Inspect before editing.
- Preserve all current features and data behavior.
- Do not reset, stash, clean, discard, or delete unrelated work.
- Do not run database reset/drop/truncate commands.
- Do not create or delete migrations unless absolutely necessary; prefer existing JSON/string lifecycle structures.
- Do not modify medication import/catalogue work.
- Do not redesign the patient workspace.
- Do not add diagnosis, treatment, medication, guideline, AI, or protocol logic.
- Do not commit, push, tag, or open a pull request.
- Do not stage secrets, environment files, uploads, backups, raw datasets, or PHI.

## Required behavior

1. Add `Refractory` as a supported complaint lifecycle state alongside:
   - Active
   - Improving
   - Resolved
   - Chronic

2. Use the exact canonical persisted value already consistent with the codebase naming convention. Prefer `REFRACTORY` internally if current enums/constants are uppercase, while showing `Refractory` in the UI.

3. Update every relevant layer found during inspection:
   - shared type/constant/schema
   - backend validation and persistence
   - complaint update/signing logic
   - Patient Overview complaint rendering/filtering
   - encounter complaint selector/editor
   - API DTO validation where applicable
   - tests

4. Refractory must:
   - remain visible in longitudinal complaint history
   - remain clinically active on Patient Overview unless the current architecture explicitly has a separate active-family rule
   - not behave as Resolved
   - not duplicate the complaint when the same encounter is signed again
   - retain encounter/date/source provenance using existing mechanisms

5. UI:
   - label: `Refractory`
   - use a restrained purple status badge only if the existing design system supports status colors
   - no flashing or pulsing
   - preserve mobile layout

6. Backward compatibility:
   - existing Active, Improving, Resolved, and Chronic values continue to work unchanged
   - unknown historical values must not crash rendering

## Test requirements

Add or update focused tests proving:

1. Backend accepts Refractory.
2. Refractory persists through encounter save/sign.
3. Refractory complaint remains in longitudinal history.
4. Refractory is not filtered as Resolved.
5. Repeated signing is idempotent and does not duplicate the complaint.
6. Existing four statuses still pass.
7. UI renders the Refractory label safely.

Run only focused checks first:

- relevant unit/integration test files
- targeted TypeScript typecheck if available
- `git diff --check`

Do not run the entire repository test suite unless the focused implementation requires it.

## Final output

Leave all implementation changes uncommitted in the GitHub Actions workspace.

Report:

- files changed
- implementation approach
- tests run and exact results
- typecheck result if run
- `git diff --check` result
- migration status
- blockers or uncertainties
- confirmation: no commit, push, or tag

If any mandatory focused test fails, state exactly:

`PARTIAL — NOT COMPLETE`
