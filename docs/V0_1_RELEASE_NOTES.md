# V0.1 Pilot Release Notes

Date: 2026-06-28

Prij Clinic V0.1 is a local/private pilot foundation for demo and engineering review. It is not production-ready, not a medical device, and must not be used with real patient data.

## Completed Pilot Workflow

V0.1 supports a demo-safe end-to-end clinic workflow:

Login -> dashboard -> patient registration -> consent foundation -> appointment -> queue/check-in -> encounter -> prescription -> investigation order -> pregnancy/OB ultrasound/report -> invoice/payment -> audit/security checks -> AI draft placeholder review.

## Included Modules

- Auth, demo login, JWT bearer/cookie support.
- Server-side RBAC and route-level security tests.
- Branch-scoped demo records and referenced-record write scope checks where implemented.
- Audit logging and expanded audit assertions for representative sensitive reads, writes, status changes, sign/review actions, payments, consents, and AI draft review.
- Patients, appointments, queue, encounters, prescriptions, investigations, reports, pregnancies, OB ultrasound, billing, payments, dashboard.
- Consent record foundation.
- Disabled/mock-only AI draft placeholders.
- Local backup/restore helper scripts.
- CI and PostgreSQL-backed security integration workflow.
- V0.1 E2E demo workflow test.

## Safety Boundaries

- No real patient data.
- No real payment gateway.
- No real report uploads or PHI files.
- No external AI API calls.
- No diagnostic AI.
- No autonomous diagnosis, prescribing, signing, final-record update, RBAC bypass, consent bypass, or doctor-approval bypass.
- OB ultrasound records are manual data records only and do not diagnose FGR or any condition.

## Verification Commands

```powershell
npm run dev:stop
npm run prisma:repair
npm run prisma:seed
npm run typecheck
npm run build
npm run smoke:test
npm run test:security
npm run test:security:ci
npm run test:security:expanded
npm run test:e2e:v01
```

## Remaining Limits

- Patient-to-doctor assignment is not modeled; doctor patient reads remain branch-scoped outside doctor-owned records.
- Lower-role positive-path coverage is representative and not exhaustive for every state transition.
- Consent enforcement is partial and not production legal workflow.
- File storage is documented but not implemented for real PHI files.
- Backup scripts are local helpers, not production backup infrastructure.
- Audit logs are application append-only but not tamper-resistant.
- MFA, monitoring, legal review, production deployment, and operational runbooks remain future work.
