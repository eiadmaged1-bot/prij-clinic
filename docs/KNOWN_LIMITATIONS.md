# Known Limitations

This MVP foundation is not production-ready for real clinical operations. It is a local development foundation for review and hardening.

## Security And Privacy

- Branch, clinic, patient, and doctor scoping are improved for read paths but still incomplete for every write/reference path.
- Sensitive read audit coverage now exists for core sensitive MVP reads, but export/download and future timeline reads still need policy-specific coverage.
- MFA, password reset, session revocation, device/session inventory, and full throttling policy are not implemented.
- No backup job, encrypted backup storage, or restore-test automation is implemented yet.
- No secure report file/object storage is implemented. Current report records store metadata/reference text only.
- Audit logs are application append-only, but database-level tamper resistance and retention controls are not implemented.

## RBAC

- Several controllers still use coarse MVP permissions where granular permission names do not exist yet, such as `pregnancy.manage` and `ob_ultrasound.manage`.
- Granular seeded permissions are now enforced for patients, appointments, queue status updates, encounters, prescriptions, investigations, and reports.
- Production role design needs explicit clinical, billing, admin, audit, and system-owner separation.
- UI navigation is not an authorization boundary; server-side guards are the source of truth.
- Patient-to-doctor assignment is not modeled, so doctor access is not yet limited to assigned patients outside doctor-owned records.

## Clinical Workflow

- Patient profile timeline is not complete.
- Consent records and consent enforcement are not implemented.
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
- Focused local security scripts now cover representative RBAC denial paths, branch scope behavior, audit log creation, and AI draft safety. Exhaustive automated tests for every route, billing rollup edge case, and state transition are still needed.
- GitHub Actions has a database-backed API security integration workflow, but coverage is still representative rather than exhaustive.
- CI security integration does not run the Next.js web app, browser smoke checks, or full route-by-route RBAC matrices.
