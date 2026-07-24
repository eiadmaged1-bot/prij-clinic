# Codex Sprint Prompt — Encounter & Patient Overview Hardening

## Recommended model for this sprint: Codex 5.6 High

Reason: This sprint touches encounter persistence, signed-record integrity, Patient Overview derivation, longitudinal complaints, menstrual visualization, autosave revisions, and responsive clinical UI.

```text
SPRINT A — ENCOUNTER & PATIENT OVERVIEW HARDENING

Repository:
C:\Newfolder\prij-clinic

Expected source branch:
feat/patient-clinical-input-foundation

IMPORTANT:
Inspect the actual branch and dirty worktree before editing.
Preserve all existing uncommitted work and local data.

Do not:
- reset
- stash
- clean
- discard changes
- replace the current application from old HTML
- delete data
- truncate tables
- recreate the database
- delete migrations
- refactor unrelated modules
- modify medication importer/catalogue work
- commit
- push
- tag

GOAL

Improve the current application only.

Implement a focused hardening sprint for:

1. Patient identity/banner correctness
2. Longitudinal complaint and menstrual visibility
3. Encounter split-screen and navigation
4. Pause/cancel/addendum workflows
5. Field provenance
6. Revision-safe autosave and sync state
7. Finish-review safety
8. Read-only historical visit viewing
9. Permanent-history correction protection

APPROVED FEATURES IN SCOPE

Feature 7 — G/P/A/L banner pin
- Derive from signed obstetric outcomes.
- Do not create an independently editable duplicate string.
- Show unknown/incomplete when source records are incomplete.

Feature 8 — Consanguinity banner
- Structured fields: isConsanguineous, relationshipDegree, optional note.
- Doctor-visible.
- Link to source history record.

Feature 9 — BMI and weight trajectory
- Use dated height/weight measurements.
- Show current BMI and change from previous measurement.
- Do not diagnose or recommend treatment.
- Use calm status styling; no pulsing animation.

Feature 13 — Latest delivery mode
- Derive from latest signed delivery outcome.
- Show NVD / operative vaginal / CS / unknown.

Feature 15 — Exam anxiety/vaginismus
- Doctor-only sensitive banner.
- Never print or expose to patient portal by default.
- Store source, author, date, and active status.

Feature 17 — Communication barrier
- Separate preferred language, interpreter required, and low-literacy/visual-instruction preference.
- Do not use one vague boolean.

Feature 18 — Previous CS count
- Derive from signed delivery records.

Feature 22 — Active bleeding icon
- Derive from current unresolved signed complaint/episode state.
- Clicking opens the source complaint/history.

Feature 23 — Unresolved critical action
- General task/banner for pathology pending, critical result awaiting review, or overdue result.
- Include owner, due date, source, and status.
- Do not lock the complete file.

Feature 28 — Preferred name
- Display beside legal name.
- Never replace legal identity.

Feature 45 — Lab delta
- Compare only the same canonical investigation code and compatible unit.
- Show previous value and date.
- Do not infer improvement or deterioration.

Feature 46 — Refractory complaint state
Complaint lifecycle becomes:
- Active
- Improving
- Resolved
- Chronic
- Refractory

Store status changes as longitudinal events with encounter, author, date, and optional reason.

Feature 47 — Complaint severity evolution
- Use signed complaint snapshots only.
- Map Mild/Moderate/Severe for display.
- Show the last three points as a micro-trend.
- Do not infer diagnosis.

Feature 49 — Menstrual three-month mini-calendar
- Use recorded menstrual snapshots and documented bleeding dates only.
- Do not fabricate missing bleeding days.
- Support month navigation and source encounter links.
- Show “Insufficient recorded data” when needed.

Feature 101 — Split-screen encounter
Desktop:
- 60% editable encounter
- 40% read-only Patient Overview/history

Mobile:
- single-column
- collapsible summary drawer

The right pane must not unmount or reset the encounter draft.

Feature 102 — Section jump navigation
- Sticky desktop navigation.
- Compact mobile stepper.
- Complaint, History, Examination, Impression, Prescription, Investigations, Ultrasound, Follow-up, Review.
- Filled status uses meaningful structured data, not non-empty JSON alone.

Feature 106 — Pause visit
- Add PAUSED if not already supported.
- Persist draft.
- Preserve queue and ownership rules.
- Do not allow two unsafe writers.
- Resume restores the exact draft and revision.

Feature 107 — Cancel reason
- Structured reason code plus optional note.
- Required by backend.
- Audit actor, reason, encounter, and date.
- No deletion.

Feature 108 — Signed encounter addendum
- Append-only addendum entity or safe existing structure.
- Author, timestamp, reason, and content.
- Original signed encounter remains unchanged.
- Addendum appears in historical view and authorized print profiles.

Feature 109 — Field provenance
Each structured field or grouped entry preserves:
- author user
- author role
- created/updated timestamp
- source device/session where already available
- confirmation status

Nurse/assistant-entered draft data may show a subtle blue marker.
Doctor-confirmed data shows confirmed state after review/signing.
Do not rely only on CSS or the current logged-in role.

Feature 110 — Per-field autosave
- Debounced delta PATCH.
- Revision number / optimistic concurrency.
- Patient and encounter scope.
- Retry queue.
- Validation errors remain visible.
- Never replace newer server data silently.

Feature 111 — Live sync indicator
States:
- Unsaved
- Saving
- Synced
- Offline queued
- Conflict
- Save failed

Use actual server acknowledgment.
navigator.onLine alone is not proof of sync.

Feature 115 — Missing follow-up review
Before signing, require one:
- follow-up date/task
- PRN
- admitted/transferred
- no follow-up required with reason

Feature 119 — Unresolved previous complaints
- Compare the active complaint registry with current addressed complaint states.
- Doctor can mark addressed, deferred, resolved, still active, or not relevant today.
- Do not force duplication into the current complaint list.

Feature 150 — Time-travel view
- Open the exact signed encounter snapshot read-only.
- Include version, signature, amendments, and addenda.
- Do not mount old data into the active draft.
- Provide return-to-current-visit action.

Feature 200 — Permanent history protection
- Permanent/anatomical/surgical history cannot disappear by ordinary deselection after signing.
- Removal requires an audited correction workflow with reason, author, timestamp, and replacement/corrected value when applicable.
- Preserve the prior value in history.

PATIENT OVERVIEW RULES

Patient Overview remains derived from:
- active episode
- latest signed encounters
- complaint lifecycle records
- signed menstrual snapshots
- completed investigations/results
- completed ultrasound reports
- current medication records
- care/follow-up tasks

Draft data may appear only in a separate clearly labelled area:
“Current visit draft — not part of confirmed summary.”

Do not create a second independent patient-summary database.

DATA AND MIGRATION RULES

1. Inspect the current schema and services before changing anything.
2. Reuse Encounter JSON or existing additive entities when safe.
3. Use a minimal additive migration only when required for addenda, revision metadata, provenance, complaint lifecycle events, or permanent-history correction events.
4. Before any migration, create a timestamped database backup and record protected counts.
5. No protected count may decrease.
6. Never overwrite signed historical snapshots.

OUT OF SCOPE

Do not implement:
- patient portal
- mobile app
- new permanent specialty tabs
- clinical calculators
- FMF/MFMU/FRAX/O-RADS/ASCCP logic
- diagnosis suggestions
- treatment recommendations
- medication recommendations
- DICOM integration
- voice AI
- clinical-trial matching
- SNOMED integration
- research workflows
- new medication import
- broad UI redesign

TESTS

Add focused tests for:

1. G/P/A/L derives correctly from signed outcomes.
2. Prior CS count derives correctly.
3. Sensitive banner fields respect role and print visibility.
4. Active bleeding opens the source record.
5. Refractory complaint lifecycle persists longitudinally.
6. Severity trend uses signed snapshots only.
7. Menstrual mini-calendar does not fabricate dates.
8. Split-screen does not reset the draft.
9. Pause/resume restores the same revision.
10. Cancel requires a reason.
11. Addendum does not modify the signed encounter.
12. Nurse-authored fields preserve provenance.
13. Autosave handles delayed and failed responses.
14. Revision conflict does not overwrite newer data.
15. Follow-up disposition is required before signing.
16. Unresolved complaints appear in review.
17. Time-travel is read-only.
18. Permanent history requires audited correction.
19. Patient Overview refreshes after successful signing/addendum.
20. Mobile layouts at 390px and 320px have no page-level horizontal overflow.

VALIDATION ORDER

1. git status / branch / diff inspection
2. data backup and protected counts
3. schema/service mapping report
4. backend persistence and tests
5. frontend components
6. focused tests
7. typecheck
8. relevant full test suite
9. production build
10. git diff --check
11. final protected counts
12. final git status

Do not commit, push, or tag.

FINAL REPORT

Maximum 35 concise lines.

Include:
- branch
- dirty-worktree preservation
- backup path and size
- protected counts before/after
- migration status
- files changed
- each approved feature status
- tests and exact results
- typecheck/build/diff status
- manual QA remaining
- blockers
- confirmation that no protected data was deleted
- confirmation that no commit/push/tag occurred

If any mandatory acceptance test fails, report:
PARTIAL — NOT COMPLETE
```
