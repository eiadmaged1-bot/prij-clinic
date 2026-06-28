# Next Steps

The exact next recommended sprint is:

## Expand Route-Level Authorization Coverage

Goals:

- Add route-by-route RBAC allow/deny coverage for every controller action.
- Add branch and doctor scope fixtures for create/update referenced-record checks.
- Add audit assertions for every sensitive read and write/status/sign/review/payment action.
- Add negative AI safety tests proving AI draft routes cannot update final clinical records.

The current CI security workflow covers representative API integration paths only. Do not start production hardening until route-level authorization, scope, and audit coverage is broader.

## Later Hardening

- Add full referenced-record scope validation on create/update paths.
- Model patient-to-doctor assignment and patient timeline permissions.
- Implement consent records and consent enforcement.
- Add correction/versioning workflows for signed clinical records.
- Define production audit retention and tamper-resistance controls.
- Design secure report file storage before accepting PHI files.
- Keep AI disabled until a separate consent, privacy, provider, RBAC, audit, and doctor-review design is approved.
