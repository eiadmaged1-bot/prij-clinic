# Data Hygiene and Test Isolation

## Classification policy

Operational records use an auditable `DataClassification`: `REAL`, `TEST`, `NEEDS_REVIEW`, or `QUARANTINED`. The field covers patients, external submissions, ultrasounds, encounters, and queue tickets. Newly created/imported records default to `REAL`/active unless an authorized workflow explicitly chooses another state.

Reception, Doctor, Queue, Case Library, Ultrasound, and Intake operational queries exclude only confirmed `TEST` and `QUARANTINED` classifications. Names, MRNs, notes, or QA patterns never silently hide or delete a record. Candidate signals such as Demo Route, Demo Workflow, Demo Clinical, Test Intake Only, known test identities, and repeated empty contract artifacts appear only in the Owner review center.

## Owner review actions

The Owner-only Data Hygiene center reports classification candidates, incomplete patients, exact normalized-phone duplicate groups, orphan active queue locks, empty ultrasound records, and imported corrections. Mark Real, Mark Test, Quarantine, and Restore are audited with actor, reason, previous/new classification, and record identifier. Review report export contains operational metadata for authorized review.

Signed clinical records, referenced records, and audit attribution are never automatically hard-deleted. The current release intentionally provides no bulk reactivation or bulk hard-delete action.

## Test database isolation

Automated database tests must supply `TEST_DATABASE_URL`, the URL must be visibly test-named, and it must not equal `DATABASE_URL`. `scripts/test-database-guard.mjs` refuses unsafe execution; `scripts/verify-test-database-isolation.mjs` reports configuration without connecting or printing credentials. Test-created rows must carry deterministic test metadata, and cleanup may target only the verified test database.

## Migration behavior

The classification migration is forward-only and assigns the conservative default `REAL` so existing records remain visible. This default is not a clinical or operational verification claim. Owner review is required before reclassifying legacy records.
