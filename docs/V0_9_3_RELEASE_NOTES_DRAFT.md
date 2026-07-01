# v0.9.3 Release Notes Draft

Status: release candidate only. v0.9.3 is not final and no release tag has been created.

## Highlights

- Added an automated QA harness for v0.9.3 release stabilization.
- Added the CI `v0.9.3 Release Gate`, which runs against a demo-only PostgreSQL service and must not use `V093_ALLOW_ENV_SKIP=1`.
- Preserved the Prij Heritage theme inherited from v0.9.2.
- Preserved the medication UI declutter inherited from v0.9.2.
- Added automated patient creation checks for fake/demo patient workflow validation.
- Added automated role visibility checks for representative role-based access behavior.

## Validation Status

- CI Release Gate: passed.
- Normal CI: passed.
- Final local Docker/PostgreSQL validation: pending.
- Manual browser QA: pending.
- Release tag: not created.

## Safety Position

- Not production-ready.
- Local/demo only.
- No real patient data.
- No real payment gateway.
- No external AI.
- No autonomous prescribing.
- AI clinical output remains draft-only until reviewed and approved by a doctor.
- Medication market strength/form/pack metadata is reference metadata only and must never be treated as patient dosing.

## Known Limitations

- Final release validation still requires Docker Desktop/PostgreSQL on the local release machine.
- Manual browser QA across routes and roles is still required.
- CI success does not replace local/manual release validation.
- No production security, privacy, legal, medical-device, or clinical-governance signoff has been completed.
- Finance remains manual demo workflow with no real payment processor.
- Medication data remains review-gated reference/market metadata where applicable.
