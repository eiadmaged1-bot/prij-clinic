# v0.12.7 Demo Candidate Stabilization

v0.12.7 is a stabilization and browser QA lock for the accelerated Prij Clinic branch. It does not add major product features.

## Scope

- Proves local app startup, API health, login, patient creation, patient workspace, doctor visit flow, generic-first prescription workflow, medication safety terminal, source review/import UI protection, investigations, follow-up, and packet visibility.
- Adds `npm run test:v127:demo-candidate-browser` for browser QA and `npm run test:v127:no-code-ui` for normal UI wording checks.
- Keeps medication safety source import/review as a governed Owner/Admin workflow.
- Protects medication safety source review UI from receptionist/accountant roles.

## Safety

- No fake clinical claims were added.
- No fake medication safety claims were added.
- No autonomous diagnosis, prescribing, dosing, treatment ranking, or final clinical plan generation was added.
- AI remains doctor-assist and draft-only. It must not replace doctor review or approval.
- Medication safety source import exists, but reviewed source population remains a separate governed workstream.
- Real patient use still requires production security, privacy, legal, operational, backup, consent, and clinical governance readiness.

## Verification

The final stabilization suite includes Prisma generation/migration, clean DB verification, v121-v127 safety/workflow checks, typecheck, build, API-base/CORS/hydration/image/document upload checks, and no-fake UI checks.

Browser QA uses synthetic local QA patient data only and removes it through the existing v121 local cleanup script after the run.

## Remaining Limitations

- Browser QA is an automated demo-candidate lock, not production certification.
- Physical mobile/phone QA is still separate.
- Medication safety profiles can be imported for review, but clinical reliance requires reviewed source metadata and doctor judgment.
- Production use is blocked until security/legal/privacy/backup/monitoring/deployment readiness is completed.
