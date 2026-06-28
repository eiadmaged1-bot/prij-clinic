# Known Limitations

This MVP foundation is not production-ready for real clinical operations. It is a local development foundation for review and hardening.

## Security And Privacy

- Branch, clinic, patient, and doctor scoping are incomplete.
- Sensitive read audit coverage is incomplete.
- MFA, password reset, session revocation, device/session inventory, and full throttling policy are not implemented.
- No backup job, encrypted backup storage, or restore-test automation is implemented yet.
- No secure report file/object storage is implemented. Current report records store metadata/reference text only.
- Audit logs are application append-only, but database-level tamper resistance and retention controls are not implemented.

## RBAC

- Several controllers use coarse MVP permissions such as `*.manage`.
- More granular seeded permissions exist but are not consistently enforced yet.
- Production role design needs explicit clinical, billing, admin, audit, and system-owner separation.
- UI navigation is not an authorization boundary; server-side guards are the source of truth.

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
- Focused automated tests for RBAC denial paths, audit log creation, billing rollups, and AI draft state transitions are still needed.
