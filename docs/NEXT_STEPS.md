# Next Steps

The exact next recommended sprint is:

## Automated RBAC, Scope, And Audit Tests

Goals:

- Add focused API tests for anonymous denial, permission denial, owner success, branch-scope filtering, and doctor-scope filtering.
- Add audit assertions for sensitive reads and write/status/sign/review/payment actions.
- Add negative AI safety tests proving AI draft routes cannot update final clinical records.
- Add smoke-test coverage for representative forbidden requests with valid users that lack specific permissions.

Do not start production hardening until this test sprint is complete.

## Later Hardening

- Add full referenced-record scope validation on create/update paths.
- Model patient-to-doctor assignment and patient timeline permissions.
- Implement consent records and consent enforcement.
- Add correction/versioning workflows for signed clinical records.
- Define production audit retention and tamper-resistance controls.
- Design secure report file storage before accepting PHI files.
- Keep AI disabled until a separate consent, privacy, provider, RBAC, audit, and doctor-review design is approved.
