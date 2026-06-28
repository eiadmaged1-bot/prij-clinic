# Known Limitations

This MVP foundation is not production-ready for real clinical operations. It is a local development foundation for review and hardening.

## Security And Privacy

- Branch, clinic, patient, and doctor scoping now cover representative read paths and referenced-record write paths for implemented MVP modules, but production-grade policy for every future state transition is still incomplete.
- Sensitive read audit coverage now exists for core sensitive MVP reads, but export/download and future timeline reads still need policy-specific coverage.
- MFA, password reset, session revocation, device/session inventory, and full throttling policy are not implemented.
- No backup job, encrypted backup storage, or restore-test automation is implemented yet.
- Local backup/restore helper scripts exist, but no production backup job, encrypted backup storage, off-site backup, or formal restore-test automation is implemented yet.
- No secure report file/object storage is implemented. Current report records store metadata/reference text only, and the file storage security plan remains documentation.
- Audit logs are application append-only, but database-level tamper resistance and retention controls are not implemented.

## RBAC

- Several controllers still use coarse MVP permissions where granular permission names do not exist yet, such as `pregnancy.manage` and `ob_ultrasound.manage`.
- Granular seeded permissions are now enforced for patients, appointments, queue status updates, encounters, prescriptions, investigations, and reports.
- Production role design needs explicit clinical, billing, admin, audit, and system-owner separation.
- UI navigation is not an authorization boundary; server-side guards are the source of truth.
- Patient-to-doctor assignment is not modeled, so doctor access is not yet limited to assigned patients outside doctor-owned records.

## Clinical Workflow

- Patient profile timeline is not complete.
- Consent records now exist as a V0.1 foundation, but production legal text, signature capture, consent override workflow, and full server-side consent enforcement are not implemented.
- Signed encounter correction/versioning is not implemented.
- Prescription approval is represented by a sign action in the MVP foundation and needs final doctor-approval semantics before production use.
- Investigation result review and report review are foundational only.
- OB ultrasound records do not provide diagnostic automation and must not be interpreted as automated clinical decision support.

## Billing

- Invoice/payment flows are foundational only.
- Refunds, invoice void reason workflow, discount approval workflow, and payment gateway integrations are not implemented.
- Payment records must remain metadata-only and must not store card numbers, CVV, payment tokens, or gateway secrets.

## AI

- AI is disabled/mock-only.
- No external AI API calls are allowed in the current foundation.
- AI draft placeholders are not clinical output and cannot update final clinical records.
- Any future AI integration requires separate consent, RBAC, audit, privacy, provider, and doctor-review design.

## Testing

- Current verification relies on typecheck, build, Prisma repair/seed, and smoke checks.
- Focused local security scripts now cover representative RBAC denial paths, branch scope behavior, referenced-record write denial paths, audit log creation, and AI draft safety. Exhaustive automated tests for every billing rollup edge case and future state transition are still needed.
- GitHub Actions has a database-backed API security integration workflow, including expanded route-security coverage, but it remains API-focused rather than full browser E2E production testing.
- CI security integration does not run the Next.js web app, browser smoke checks, or full route-by-route RBAC matrices.
- Expanded local Node tests now cover implemented protected API routes, representative denied-role cases, branch scope, referenced-record write denial paths, audit assertions, and AI safety regression. They still do not prove production-grade authorization for every future state transition.
- Expanded tests use seeded owner access as the positive control. They do not yet prove every allowed lower-role path for every route and state transition.
- `npm run test:e2e:v01` covers a fake/demo happy path only. It does not prove clinical correctness, legal consent compliance, payment compliance, production security, or medical-device readiness.

## Deployment

- V0.1 is local/private pilot software only.
- Production deployment, staging hardening, secrets management, monitoring, HTTPS policy, MFA, secure file storage, backup encryption, restore proof, and legal/privacy review remain future work.
