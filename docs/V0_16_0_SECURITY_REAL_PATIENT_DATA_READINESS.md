# v0.16.0 Security + Real Patient Data Readiness

This sprint prepares the clinic system for intentional real patient data readiness. It does not add new clinic features and does not authorize use with real patient data until deployment, operational, legal, consent, backup, and privacy reviews are completed.

## Readiness Controls Added

- API responses now receive baseline security headers without adding a new dependency.
- Strict staging and production runtime validation now rejects:
  - `DEMO_MODE=true`
  - `PATIENT_FILE_STORAGE_MODE=local_demo_file`
  - non-HTTPS `APP_URL`
  - weak or production-inappropriate `JWT_EXPIRES_IN` format
- Audit logging now redacts credential-like metadata keys and bearer/API-key-like string values before persistence.
- Investigation order cancellation and void transitions now require a reason, persist the reason in the modeled reason fields, and include reason capture in audit metadata.
- A static v0.16 readiness gate was added as `npm run test:v160:real-data-readiness`.

## Preserved Locks

- v0.14.4 clinic walkthrough lock remains covered by `npm run test:v144:clinic-walkthrough`.
- v0.15.0 MVP business layer remains covered by `npm run test:v150:mvp-business-walkthrough`.
- Patient registration, reception/check-in, doctor waiting, doctor visit, prescription, investigations, follow-up/packet, billing, reports, and settings are not expanded in this sprint.

## Still Required Before Real Patient Use

- Final legal consent text and jurisdiction review.
- Production backup scheduling, restore drills, retention policy, and documented operator ownership.
- Hosting/network hardening review, TLS termination review, logging retention review, and database access review.
- End-to-end RBAC and audit verification against the selected production roles.
- Written policy that AI and Care Assist outputs remain draft-only until reviewed and approved by a doctor.
