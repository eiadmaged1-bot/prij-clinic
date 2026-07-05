# v0.17.1 Safe AI Review Lock

v0.17.1 stabilizes the v0.17.0 Safe AI Assistant layer and fixes the local/demo seed idempotency issue for queue tickets.

## Scope

- The Safe AI Assistant layer remains intact.
- AI output remains draft-only until reviewed and approved by a doctor.
- External AI is disabled by default.
- Receptionist/accountant and lower-role access remains blocked from clinical AI tools.
- Prompt-injection guard checks remain active.
- Seed queue tickets no longer collide on `branchId`, `queueDate`, and `queueNumber`.

## Safety Boundaries

- No autonomous diagnosis, prescribing, dosing, treatment ranking, or final record writing.
- No external AI calls were added.
- No PHI/PII is sent externally.
- Synthetic/demo data remains clearly local/test-only.
- This is not production AI.
- Future copy-to-record requires a separate audited, doctor-confirmed workflow.

## Verification

Passed locally:

- `npm run prisma:generate`
- `npm run prisma:migrate:deploy`
- `npm run prisma:seed`
- `npm run test:v144:clinic-walkthrough`
- `npm run test:v150:mvp-business-walkthrough`
- `npm run test:v160:security-real-data-readiness`
- `npm run test:v161:security-deployment-prep-lock`
- `npm run test:v170:ai-safety-layer`
- `npm run test:v170:prompt-injection-guard`
- `npm run test:v170:safe-ai-assistant`
- `npm run test:ai:regression`
- `npm run test:security:ci`
- `npm run test:security:expanded`
- `npm run test:accounts:rbac`
- `npm run test:web:api-base`
- `npm run test:security:cors`
- `npm run test:web:hydration-root`
- `npm run test:security:image-metadata`
- `npm run test:v120:no-fake-ui`
- `npm run typecheck`
- `npm run build`
