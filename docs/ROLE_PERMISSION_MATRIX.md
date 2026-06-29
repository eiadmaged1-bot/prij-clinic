# Role Permission Matrix

Date: 2026-06-28

This matrix documents the seeded V0.1 demo roles and the lower-role permission expectations used by route-level security tests. It is not a production role policy.

## Safety Rules

- Owner is intentionally broad for local demo setup, repair, seed, and security review.
- `eyad` is the only protected local demo System Owner. Reserved `system_owner.manage` and `developer_owner.manage` permissions are per-user protected metadata and are not normal Owner/Admin role grants.
- Admin is administrative only in the current seed and is not the clinical/billing operator role.
- Doctor can manage clinical drafts, sign clinical records, request/review AI draft placeholders, and is scoped by branch plus doctor-owned records where modeled.
- Nurse can read/support clinical workflow and queue status, but cannot sign encounters, prescriptions, reports, or manage billing.
- Receptionist can register patients, manage consent foundation records, appointments, queue, and metadata-only payments, but cannot manage or sign clinical records.
- Accountant can manage billing and read limited patient context, but cannot manage clinical records.
- Patient-to-doctor assignment is not modeled yet, so doctor patient access is branch-scoped rather than assignment-scoped outside doctor-owned records.
- AI remains disabled/mock-only and cannot update final clinical records.

## Module Matrix

| Module | Owner | Admin | Doctor | Nurse | Receptionist | Accountant | Test Coverage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Admin users/roles/permissions | Full | Full | No | No | No | No | Route auth denied-role tests |
| Audit logs | Full | Full | No | No | No | No | Route auth and audit assertion tests |
| Patients | Full | No seeded clinical grant | Read/manage seeded broadly for demo; branch-scoped | Read only, branch-scoped | Create/read/update, branch-scoped | Read limited, branch-scoped | Route auth + referenced scope tests |
| Consent records | Full | No seeded clinical grant | Read only | No | Create/read, branch-scoped | No | Route auth + referenced scope tests |
| Appointments | Full | No seeded clinical grant | Read branch/own-doctor scoped | Read only | Manage/read | No | Route auth + referenced scope tests |
| Queue | Full | No seeded clinical grant | Read only | Read/status update | Manage/read/status update | No | Route auth tests |
| Encounters | Full | No seeded clinical grant | Create/read/update/sign, branch/doctor scoped | Read only | No | No | Route auth + referenced scope tests |
| Prescriptions | Full | No seeded clinical grant | Create/read/update/sign, branch/doctor scoped | No | No | No | Route auth + referenced scope tests |
| Investigations | Full | No seeded clinical grant | Create/read/update/review, branch/doctor scoped | No seeded route access except legacy read aliases | No | No | Route auth + referenced scope tests |
| Reports | Full | No seeded clinical grant | Upload/read/review/manage, branch-scoped | Read only | No | No | Route auth + referenced scope tests |
| Pregnancies | Full | No seeded clinical grant | Read/manage, branch-scoped | Read only | No | No | Route auth + referenced scope tests |
| OB ultrasound | Full | No seeded clinical grant | Read/manage/review, branch-scoped; no diagnosis automation | Read only | No | No | Route auth + referenced scope tests |
| Billing invoices/payments | Full | No seeded billing grant | No | No | Payment metadata only | Read/manage/void/report | Route auth + referenced scope tests |
| Dashboard | Full | No seeded dashboard grant | No in current route tests | No | No | Read | Route auth tests |
| AI drafts | Full | No seeded AI grant | Request/read/review placeholder drafts only | No | No | No | Route auth + AI regression tests |

## Denied Lower-Role Expectations

| Scenario | Expected denial |
| --- | --- |
| Receptionist signs encounter, prescription, or report | `403` |
| Accountant creates or updates clinical records | `403` |
| Doctor manages billing invoice/payment routes | `403` |
| Nurse manages billing routes | `403` |
| Nurse reviews AI drafts | `403` |
| Unauthenticated user accesses protected routes | `401` |
| Staff references out-of-branch patients in create workflows | `400`/`403`/`404` safe failure |

## Current Demo Limitations

- Admin is seeded for administrative review, not as a production superuser workflow.
- Some legacy plural permission aliases remain seeded for compatibility but are not the preferred route permission names.
- Lower-role positive-path coverage is representative, not exhaustive for every state transition.
- Doctor assignment to patients is not modeled; doctor-owned records are scoped where `doctorId` exists.
- Production deployment still requires a separate role-design review, consent enforcement policy, audit retention/tamper-resistance controls, MFA, and monitoring.
