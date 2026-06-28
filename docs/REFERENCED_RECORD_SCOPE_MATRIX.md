# Referenced-Record Scope Matrix

Date: 2026-06-28

This matrix tracks V0.1 routes that accept path, query, or body IDs and therefore must validate referenced-record scope. It is a security-hardening document, not a production compliance claim.

## Scope Rules

- Owner/Admin: broad local demo access.
- Non-owner/non-admin: branch-scoped where `branchId` or patient branch is modeled.
- Doctor: branch-scoped plus doctor-owned scope for appointments, encounters, prescriptions, and investigation orders where `doctorId` exists.
- Patient-to-doctor assignment is not modeled; patient reads remain branch-scoped rather than assigned-doctor scoped.
- Unauthorized referenced records should fail as `403`/`404`/safe `400` without leaking cross-branch details.

## Matrix

| Route | Method | Referenced IDs | Model(s) | Permission | Branch Scope | Doctor Scope | Patient Scope | Current Verification | Gap Severity | Test Coverage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/patients/:id` | `GET/PATCH` | path `id` | Patient | `patient.read` / `patient.update` | Enforced by patient branch lookup | Not assignment-scoped | Patient is target | Enforced | Accepted Demo Limitation | Route + scope tests |
| `/consents` | `POST` | body `patientId` | Patient, ConsentRecord | `patient.consent_manage` | Enforced through patient branch lookup | Not assignment-scoped | Consent belongs to patient | Enforced | Accepted Demo Limitation | Route tests |
| `/consents?patientId=` | `GET` | query `patientId` | Patient, ConsentRecord | `patient.consent_read` | Enforced through patient branch lookup | Not assignment-scoped | Lists only selected patient | Enforced | Accepted Demo Limitation | Route tests |
| `/appointments` | `POST` | body `patientId`, optional `doctorId` | Patient, User | `appointment.manage` | Patient branch should be allowed; doctor should belong to allowed branch when supplied | Doctor can create only in own scope when acting as doctor | Appointment patient must be allowed | Patient existence only before hardening | High | Expanded scope tests |
| `/appointments/:id/status` | `PATCH` | path `id` | Appointment | `appointment.manage` | Enforced by appointment branch lookup | Doctor scope where applicable | Appointment patient implied | Enforced | Low | Route tests |
| `/appointments/:id` | `GET` | path `id` | Appointment | `appointment.read` | Enforced | Doctor-owned where applicable | Appointment patient implied | Enforced | Low | Route tests |
| `/queue/check-in` | `POST` | body `patientId`, optional `appointmentId` | Patient, Appointment, QueueTicket | `queue.manage` | Patient and appointment should be in actor branch | Appointment doctor scope where applicable | Appointment must match patient | Patient/appointment match checked, branch actor scope incomplete before hardening | High | Expanded scope tests |
| `/queue/:id/call|complete|cancel` | `PATCH` | path `id` | QueueTicket | `queue.status_update` | Enforced by queue branch lookup | Not doctor-owned in V0.1 | Queue patient implied | Enforced | Low | Route tests |
| `/encounters` | `POST` | body `patientId`, optional `appointmentId` | Patient, Appointment, Encounter | `encounter.create` | Patient/appointment should be in actor branch | Doctor should reference own appointment when appointment is supplied | Appointment must match patient | Existence/match only before hardening | High | Expanded scope tests |
| `/encounters/:id` | `GET/PATCH` | path `id` | Encounter | `encounter.read` / `encounter.update_own` | Enforced through patient branch | Doctor-owned | Encounter patient implied | Enforced | Low | Route tests |
| `/encounters/:id/sign` | `PATCH` | path `id` | Encounter | `encounter.sign` | Enforced through patient branch | Doctor-owned | Encounter patient implied | Enforced | Low | Route tests |
| `/prescriptions` | `POST` | body `patientId`, optional `encounterId` | Patient, Encounter, Prescription | `prescription.create` | Patient/encounter should be in actor branch | Doctor should reference own encounter when supplied | Encounter must match patient | Existence/match only before hardening | High | Expanded scope tests |
| `/prescriptions/:id` | `GET/PATCH` | path `id` | Prescription | `prescription.read` / `prescription.update` | Enforced through patient branch | Doctor-owned | Prescription patient implied | Enforced | Low | Route tests |
| `/prescriptions/:id/sign` | `PATCH` | path `id` | Prescription | `prescription.approve` | Enforced through patient branch | Doctor-owned | Prescription patient implied | Enforced | Low | Route tests |
| `/investigations/orders` | `POST` | body `patientId`, optional `encounterId` | Patient, Encounter, InvestigationOrder | `investigation.create` | Patient/encounter should be in actor branch | Doctor should reference own encounter when supplied | Encounter must match patient | Existence/match only before hardening | High | Expanded scope tests |
| `/investigations/orders/:id/status` | `PATCH` | path `id` | InvestigationOrder | `investigation.update` | Enforced through patient branch | Doctor-owned | Order patient implied | Enforced | Low | Route tests |
| `/reports` | `POST` | body `patientId`, optional `encounterId`, optional `investigationOrderId` | Patient, Encounter, InvestigationOrder, Report | `report.upload` | Patient/linked records should be in actor branch | Doctor should reference own clinical records where modeled | Linked records must match patient | Existence/match only before hardening | High | Expanded scope tests |
| `/reports/:id` | `GET/PATCH` | path `id` | Report | `report.read` / `report.update` | Enforced by report branch | Doctor-specific report assignment not modeled | Report patient implied | Enforced | Accepted Demo Limitation | Route tests |
| `/reports/:id/review` | `PATCH` | path `id` | Report | `report.review` | Enforced by report branch | Doctor-specific report assignment not modeled | Report patient implied | Enforced | Accepted Demo Limitation | Route tests |
| `/pregnancies` | `POST` | body `patientId` | Patient, Pregnancy | `pregnancy.manage` | Patient branch should be actor branch | Doctor assignment not modeled | Pregnancy must belong to patient | Patient existence only before hardening | High | Expanded scope tests |
| `/pregnancies/:id` | `GET/PATCH` | path `id` | Pregnancy | `pregnancy.read` / `pregnancy.manage` | Enforced by pregnancy branch | Doctor assignment not modeled | Pregnancy patient implied | Enforced | Accepted Demo Limitation | Route tests |
| `/ob-ultrasounds` | `POST` | body `patientId`, optional `pregnancyId`, optional `encounterId` | Patient, Pregnancy, Encounter, ObUltrasound | `ob_ultrasound.manage` | Patient/linked records should be actor branch | Encounter doctor-owned where modeled | Linked records must match patient | Existence/match only before hardening | High | Expanded scope tests |
| `/ob-ultrasounds/:id` | `GET/PATCH` | path `id` | ObUltrasound | `ob_ultrasound.read` / `ob_ultrasound.manage` | Enforced by ultrasound branch | Doctor assignment not modeled | Ultrasound patient implied | Enforced | Accepted Demo Limitation | Route tests |
| `/ob-ultrasounds/:id/review` | `PATCH` | path `id` | ObUltrasound | `ob_ultrasound.manage` | Enforced by ultrasound branch | Doctor assignment not modeled | Ultrasound patient implied | Enforced | Accepted Demo Limitation | Route tests |
| `/billing/invoices` | `POST` | body `patientId` | Patient, Invoice | `billing.manage` | Patient branch should be actor branch | Not clinical doctor scope | Invoice patient must be allowed | Patient existence only before hardening | High | Expanded scope tests |
| `/billing/invoices/:id` | `GET/PATCH` | path `id` | Invoice | `billing.read` / `billing.manage` | Enforced by invoice branch | Not applicable | Invoice patient implied | Enforced | Low | Route tests |
| `/billing/invoices/:id/issue` | `POST` | path `id` | Invoice | `billing.manage` | Enforced by invoice branch | Not applicable | Invoice patient implied | Enforced | Low | Route tests |
| `/billing/payments` | `POST` | body `invoiceId` | Invoice, Payment | `payment.manage` | Enforced by invoice branch | Not applicable | Payment patient inherited from invoice | Enforced | Low | Route tests |
| `/billing/payments/:id/reverse` | `POST` | path `id` | Payment | `billing.void` | Enforced by payment branch | Not applicable | Payment patient implied | Enforced | Low | Route tests |
| `/ai-drafts` | `POST` | body `patientId`, optional `encounterId` | Patient, Encounter, AiDraft | `ai_draft.request` | Patient/encounter should be actor branch | Encounter doctor-owned where modeled | Encounter must match patient | Existence/match only before hardening | High | Expanded AI/scope tests |
| `/ai-drafts/:id` | `GET` | path `id` | AiDraft | `ai_draft.read` | Enforced by draft branch | Doctor assignment not modeled | Draft patient implied | Enforced | Accepted Demo Limitation | Route tests |
| `/ai-drafts/:id/review` | `PATCH` | path `id` | AiDraft | `ai_draft.review` | Enforced by draft branch | Doctor assignment not modeled | Draft patient implied | Enforced; no final clinical write | Accepted Demo Limitation | AI regression tests |
| `/dashboard/summary` | `GET` | none | Aggregate models | `dashboard.read` | Branch-scoped aggregate counts | Doctor dashboard scope incomplete | Aggregates only | Enforced where modeled | Medium | Smoke/security tests |
| `/audit` | `GET` | query filters only | AuditLog | `audit.read` | Branch filter accepted but owner/admin broad | Not applicable | Not patient-scoped | Permission protected | Medium | Route tests |

## Hardening Priority

Critical gaps were not found in the V0.1 baseline because protected routes require auth and RBAC. High-priority hardening targets are create paths that reference patient-linked records before actor scope was checked.

## Test Policy

- Clear public access regressions fail tests.
- Cross-branch create/reference bypasses fail tests after hardening.
- Missing patient-to-doctor assignment remains an accepted demo limitation until that model exists.
