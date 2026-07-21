# Golden Master API Contract Inventory

## Baseline

- Repository: `eiadmaged1-bot/prij-clinic`
- Frozen source commit: `47c39e4478c9d91231bcdf05bdbcc7c63e597660`
- Status: **CONTROLLER AND FRONTEND USAGE VERIFIED / LIVE RESPONSE CAPTURE PENDING**

This document defines the endpoint boundaries that the Golden Master and later menu upgrades must preserve. It is an architectural inventory, not an OpenAPI replacement. DTO field-level schemas, response examples and failure payloads must be captured from the local runtime before implementation begins.

## 1. Transport and security contract

Current backend:

- NestJS modular API.
- Browser traffic uses the web proxy under `/api/backend/...`.
- API port 3001 remains internal.
- Session cookie: `prij_clinic_session`, HTTP-only, SameSite=Lax.
- CSRF cookie: `csrf-token`, readable by the client for protected writes.
- Global throttling.
- Global CSRF guard.
- Global request logger/interceptor.
- JWT/session authentication guard.
- Permission guard on domain controllers.
- Role guard for selected Owner-only operations.
- Branch/reference scoping is enforced server-side.
- Normal UI must not expose stack traces, secrets, raw storage paths or unsafe internal identifiers.

Golden Master rule:

- The identical frontend may mock an unavailable backend only in a clearly isolated prototype mode. Production integration must retain cookies, CSRF, credentials, permission checks, idempotency and branch scope.

## 2. Authentication

Controller: `AuthController`
Base: `/auth`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Throttled public login | Accept identifier/login ID/email plus password; creates session and CSRF cookies. |
| GET | `/auth/me` | Authenticated | Returns current user and refreshes CSRF token. |
| POST | `/auth/logout` | Authenticated | Revokes current session and clears session/CSRF cookies. |

Critical states:

- Invalid credentials.
- Throttle/rate limit.
- Connection failure.
- Expired/revoked session.
- Current-session account switch.

## 3. Dashboard

Controller: `DashboardController`
Base: `/dashboard`

| Method | Path | Permission/role | Purpose |
|---|---|---|---|
| GET | `/dashboard/summary` | `dashboard.read` | Role-scoped operational, billing and safety summary. |
| GET | `/dashboard/owner-control?date=` | `dashboard.read` + Owner role | Owner metrics, readiness, tasks, services and recent audit. |

Golden Master rule:

- Owner Control must not rely on hidden navigation alone; direct access remains role guarded.

## 4. Patients and patient workspace

Controller: `PatientsController`
Base: `/patients`
Guards: authentication + permissions.

### Patient identity and directory

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/patients` | `patient.create` | Create patient; supports idempotency key. |
| POST | `/patients/create-and-start-visit` | `patient.create`, `encounter.create` | Atomic patient creation and visit start. |
| GET | `/patients/duplicate-candidates` | `patient.read` | Duplicate-prevention candidates. |
| GET | `/patients` | `patient.read` | Search/directory with q, mode, branch, patient type, status, view, sort and pagination. |
| GET | `/patients/:id` | `patient.read` | Canonical patient record. |
| POST | `/patients/:id/favorite` | `patient.read` | Add current user favorite. |
| DELETE | `/patients/:id/favorite` | `patient.read` | Remove current user favorite. |
| PATCH | `/patients/:id` | `patient.update` | Update patient fields; exact DTO to capture at runtime/source DTO pass. |

### Workspace orchestration

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/patients/:id/workspace-summary` | `patient.read` | No-store patient summary for identity/current workflow. |
| GET | `/patients/:id/workspace-layout` | `patient.read` | Resolved configurable panel layout. |
| PUT | `/patients/:id/workspace-layout` | `patient.read` | Save permitted workspace layout. |
| GET | `/patients/:id/workspace-presets/:presetKey` | `patient.read` | Load registered layout preset. |
| GET | `/patients/:id/missing-information` | `patient.read` | Current missing-information findings. |
| POST | `/patients/:id/missing-information/:findingKey/decision` | `patient.update` | Record reviewed missing-data decision. |
| GET | `/patients/:id/timeline?limit=&cursor=` | `patient.read` | Cursor-paginated patient timeline. |
| GET | `/patients/:id/follow-up-hints` | `follow_up_hints.read` | Active follow-up hints. |
| GET | `/patients/:id/qr` | `patient.read` | Patient QR information. |
| GET | `/patients/:id/qr-token` | `patient.read` | Permanent QR token information. |

### Clinical phases, fertility and history

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/patients/:id/phases` | `patient.read` | Clinical phases. |
| POST | `/patients/:id/phases` | `encounter.create` | Create phase. |
| PATCH | `/patients/:id/phases/:phaseId` | `encounter.create` | Update phase. |
| GET | `/patients/:id/infertility` | `encounter.read` | Fertility workspace. |
| POST | `/patients/:id/infertility/episodes` | `encounter.create` | Create infertility episode. |
| POST | `/patients/:id/infertility/cycles` | `encounter.create` | Create induction cycle. |
| PATCH | `/patients/:id/infertility/cycles/:cycleId/amh` | `encounter.create` | Record/update AMH context. |
| POST | `/patients/:id/infertility/monitoring-visits` | `encounter.create` | Create follicular monitoring visit. |
| POST | `/patients/:id/infertility/e2-results` | `encounter.create` | Record E2 result. |
| GET | `/patients/:id/history-sheets` | `patient.read` | Structured history sheets. |
| POST | `/patients/:id/history-sheets` | `encounter.create` | Create structured history. |
| PATCH | `/patients/:id/history-sheets/:historySheetId` | `encounter.create` | Amend structured history. |
| POST | `/patients/:id/operation-history` | `encounter.create` | Operation history; idempotent. |
| POST | `/patients/:id/medication-history` | `encounter.create` | Medication history; idempotent. |
| POST | `/patients/:id/investigation-history` | `encounter.create` | Investigation history; idempotent. |

### Patient-context convenience writes

The controller also exposes patient-scoped creation endpoints for appointments, queue check-in, encounters, prescriptions, investigations, reports, ultrasound, invoices, payments and consent. These are orchestration conveniences; canonical domain controllers remain the source of lifecycle rules.

Golden Master rule:

- Module upgrades must not create a second patient identity store or bypass canonical domain lifecycle endpoints.

## 5. Appointments

Controller: `AppointmentsController`
Base: `/appointments`

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/appointments` | `appointment.manage` | Create appointment. |
| GET | `/appointments` | `appointment.read` | List permitted appointments. |
| GET | `/appointments/calendar?date=&doctorId=` | `appointment.read` | Date/doctor calendar. |
| GET | `/appointments/:id` | `appointment.read` | Appointment detail. |
| PATCH | `/appointments/:id/status` | `appointment.manage` | Controlled status change with DTO reason fields where required. |

## 6. Queue

Controller: `QueueController`
Base: `/queue`

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/queue/check-in` | `queue.manage` | Idempotent check-in. |
| GET | `/queue/today` | `queue.read` | Today’s permitted queue. |
| PATCH | `/queue/:id/call` | `queue.status_update` | Call patient. |
| PATCH | `/queue/:id/select` | `doctor_queue.select_patient` | Select patient for doctor handoff. |
| PATCH | `/queue/:id/complete` | `queue.status_update` | Complete queue ticket. |
| PATCH | `/queue/:id/cancel` | `queue.status_update` | Cancel/remove with required reason DTO. |

Lifecycle contract:

- Check-in does not start a clinical encounter.
- Preview does not change queue status.
- Doctor selection and visit start are distinct operations coordinated by the frontend.
- Completed/cancelled tickets remain historical records.

## 7. Doctor visit

Controller: `DoctorVisitController`
Base: `/patients/:patientId/doctor-visit`

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/patients/:patientId/doctor-visit/start` | `encounter.create` | Start or resume the patient’s active visit. |
| GET | `/patients/:patientId/doctor-visit/current` | `encounter.read` | Load locked patient/encounter context. |
| PATCH | `/patients/:patientId/doctor-visit/:encounterId` | `encounter.update_own` | Save encounter draft fields. |
| POST | `/patients/:patientId/doctor-visit/:encounterId/follow-up` | `patient_task.create` | Create visit-linked follow-up; supports idempotency. |
| GET | `/patients/:patientId/doctor-visit/:encounterId/packet` | `patient.read`, `encounter.read` | Load finish/print packet. |

Related lifecycle endpoint used by UI:

- PATCH `/encounters/:encounterId/void` with mandatory reason and permission-aware action.

Golden Master rule:

- Every clinical write page must verify that route patient ID, server patient ID and encounter ID match before enabling documentation.

## 8. Prescriptions

Controller: `PrescriptionsController`
Base: `/prescriptions`

### Patient prescriptions

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/prescriptions` | `prescription.create` | Create patient/encounter-linked draft. |
| GET | `/prescriptions?patientId=` | `prescription.read` | List permitted prescriptions. |
| GET | `/prescriptions/:id` | `prescription.read` | Prescription detail. |
| PATCH | `/prescriptions/:id` | `prescription.update` | Update draft. |
| PATCH | `/prescriptions/:id/sign` | `prescription.approve` | Doctor approval/sign gate. |
| GET | `/prescriptions/:id/print` | `prescription.read` | Protected print payload. |

### Templates

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/prescriptions/templates` | `prescription_templates.read` | List visible templates. |
| POST | `/prescriptions/templates` | `prescription_templates.manage` | Create template. |
| PATCH | `/prescriptions/templates/:id` | `prescription_templates.manage` | Update template. |
| POST | `/prescriptions/templates/:id/duplicate` | `prescription_templates.manage` | Duplicate template. |
| DELETE | `/prescriptions/templates/:id` | `prescription_templates.manage` | Archive template. |

### Doctor medication shortcuts

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/prescriptions/shortcuts` | `doctor_medication_shortcuts.read` | List shortcuts. |
| POST | `/prescriptions/shortcuts` | `doctor_medication_shortcuts.manage` | Create shortcut. |
| PATCH | `/prescriptions/shortcuts/:id` | `doctor_medication_shortcuts.manage` | Update shortcut. |
| DELETE | `/prescriptions/shortcuts/:id` | `doctor_medication_shortcuts.manage` | Archive shortcut. |

Related medication APIs used by the builder:

- POST `/medications/search`.
- POST `/medications/safety-check`.
- Patient medication/allergy/follow-up endpoints.

Safety contract:

- Search results are assistive reference records.
- Patient identity, encounter identity, complete structured medication lines, review/alert acknowledgement and signature gates remain explicit.
- No automatic prescribing, dosing or treatment selection.

## 9. Investigations and clinical requests

Controller: `InvestigationsController`
Base: `/investigations`

### Ordering and drafts

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/investigations/orders` | `investigation.create` | Create legacy/canonical order where used. |
| GET | `/investigations/order-draft?patientId=&encounterId=` | `investigation.create` | Load persistent basket draft. |
| PUT | `/investigations/order-draft` | `investigation.create` | Save basket draft. |
| DELETE | `/investigations/order-draft?patientId=&encounterId=` | `investigation.create` | Clear submitted/abandoned draft. |
| GET | `/investigations/orders` | `investigation.read` | List orders. |
| GET | `/investigations/orders/:id` | `investigation.read` | Order detail. |
| PATCH | `/investigations/orders/:id/status` | `investigation.update` | Lifecycle transition with optional reason. |

### Catalog and favorites

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/investigations/catalog?q=&category=` | `investigation.read` | Catalog workspace, categories, favorites and sets. |
| POST | `/investigations/catalog/:id/favorite` | `investigation.read` | Favorite catalog item. |
| POST | `/investigations/catalog/:id/unfavorite` | `investigation.read` | Unfavorite item. |
| GET | `/investigations/favorite-sets` | `investigation.read` | List visible sets. |
| POST | `/investigations/favorite-sets` | `investigation.read` | Create personal/allowed set. |
| PATCH | `/investigations/favorite-sets/:id` | `investigation.read` | Update set. |
| POST | `/investigations/favorite-sets/:id/duplicate` | `investigation.read` | Duplicate set. |
| DELETE | `/investigations/favorite-sets/:id` | `investigation.read` | Archive set. |

### Admin catalog

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/investigations/admin/catalog` | `investigations.manage_catalog` | Govern catalog. |
| POST | `/investigations/admin/catalog` | `investigations.manage_catalog` | Create catalog item. |
| PATCH | `/investigations/admin/catalog/:id` | `investigations.manage_catalog` | Update/deactivate/restore item. |

Controller: `ClinicalRequestsController`
Base: `/clinical-requests`

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/clinical-requests` | `clinical_requests.write` | Submit patient/encounter-linked request. |
| GET | `/clinical-requests?patientId=&page=&limit=&status=` | `clinical_requests.read` | Paginated requests/follow-up counts. |
| GET | `/clinical-requests/:id` | `clinical_requests.read` | Request detail. |
| GET | `/clinical-requests/:id/print` | `clinical_requests.read` | Protected print payload. |
| POST | `/clinical-requests/:id/mark-result-received` | `clinical_requests.review` | Mark result received. |
| POST | `/clinical-requests/:id/review` | `clinical_requests.review` | Doctor review. |
| POST | `/clinical-requests/:id/cancel` | `clinical_requests.cancel` | Cancel with reason. |

Safety contract:

- Applying a set only fills the basket.
- Duplicate/prior-result warnings must be reviewed before submission.
- Result received and doctor reviewed are separate states.

## 10. Pregnancy and ultrasound

Controller: `PregnancyController`

### Pregnancy

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/pregnancies` | `pregnancy.manage` | Create episode. |
| GET | `/pregnancies` | `pregnancy.read` | List episodes. |
| GET | `/pregnancies/:id` | `pregnancy.read` | Episode detail. |
| PATCH | `/pregnancies/:id` | `pregnancy.manage` | Update episode. |
| POST/GET | `/previous-pregnancies` | manage/read | Previous pregnancy history. |
| POST/GET | `/pregnancies/:id/fetuses` | manage/read | Fetus records. |
| PATCH | `/pregnancies/:pregnancyId/fetuses/:fetusId` | `pregnancy.manage` | Update fetus. |
| POST/GET | `/pregnancies/:id/antenatal-visits` | manage/read | Antenatal visits. |

### Ultrasound

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/ob-ultrasounds` | `ob_ultrasound.manage` | Create study. |
| GET | `/ob-ultrasounds` | `ob_ultrasound.read` | Paginated/filter study list. |
| GET | `/ob-ultrasounds/:id` | `ob_ultrasound.read` | Study detail. |
| PATCH | `/ob-ultrasounds/:id` | `ob_ultrasound.manage` | Update draft. |
| PATCH | `/ob-ultrasounds/:id/complete-for-review` | `ob_ultrasound.manage` | Move to review. |
| PATCH | `/ob-ultrasounds/:id/review` | `ob_ultrasound.manage` | Review. |
| PATCH | `/ob-ultrasounds/:id/sign` | `ob_ultrasound.manage` | Sign. |
| PATCH | `/ob-ultrasounds/:id/amend` | `ob_ultrasound.manage` | Audited amendment. |

## 11. Billing and payments

Controller: `BillingController`
Base: `/billing`

### Invoices/services

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/billing/invoices` | `billing.manage` | Create invoice. |
| GET | `/billing/invoices` | `billing.read` | List invoices. |
| GET | `/billing/invoices/:id` | `billing.read` | Invoice detail. |
| PATCH | `/billing/invoices/:id` | `billing.manage` | Update draft invoice. |
| POST | `/billing/invoices/:id/issue` | `billing.manage` | Issue invoice. |
| POST | `/billing/invoices/:id/void` | `billing.void` | Void with reason. |
| GET | `/billing/services` | `billing.read` | Active billable services. |
| GET | `/billing/patients/:patientId/statement` | `billing.read` | Patient statement. |

### Payments

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/billing/payments` | `payment.manage` | Idempotent manual payment. |
| GET | `/billing/payments` | `billing.read` | List payments. |
| POST | `/billing/payments/:id/reverse` | `billing.void` | Reverse with reason. |
| POST | `/billing/payments/:id/refund` | `billing.void` | Refund with reason. |

### Reports and owner audit

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/billing/daily-closing` | `billing.report` | Daily closing totals. |
| GET | `/billing/reports/finance` | `billing.report` | Finance report. |
| GET | `/billing/owner/visit-price-audit/settings` | `billing.report` | Pricing audit settings. |
| POST | `/billing/owner/visit-price-audit/settings` | `billing.report` | Update audited pricing rules. |
| GET | `/billing/owner/visit-price-audit/report` | `billing.report` | Visit price compliance report. |

## 12. Guidelines

Controller: `GuidelinesController`
Base: `/guidelines`

### Sources/documents

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/guidelines/sources` | `guidelines.read` | Source list. |
| POST/PATCH | `/guidelines/sources...` | `guidelines.manage_sources` | Source governance. |
| POST | `/guidelines/sources/:id/check-updates` | `guidelines.import` | Check update source. |
| GET | `/guidelines/documents` | `guidelines.read` | Paginated inventory. |
| GET | `/guidelines/documents/:id` | `guidelines.read` | Document detail. |
| PATCH | `/guidelines/documents/:id` | `guidelines.review` | Metadata/review update. |
| GET | `/guidelines/documents/:id/view` | Authenticated scoped access | Private no-store byte-range streaming. |
| GET | `/guidelines/documents/:id/download` | Authenticated scoped access | Policy-controlled download. |
| PATCH | `/guidelines/documents/:id/file-access-settings` | Owner/policy enforced in service | Audited download setting. |
| POST | `/guidelines/documents/:id/review` | `guidelines.review` | Review document. |
| POST | `/guidelines/documents/:id/archive` | `guidelines.delete_or_archive` | Archive. |

### Import/search/evidence

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/guidelines/upload` | `guidelines.upload` | Max 20MB controlled upload. |
| POST | `/guidelines/import-url` | `guidelines.import` | Import allowed URL source. |
| POST | `/guidelines/documents/:id/reindex` | `guidelines.import` | Reindex one. |
| POST | `/guidelines/reindex` | `guidelines.import` | Reindex all. |
| GET | `/guidelines/search` | `guidelines.search` | Evidence search and optional synthesis. |
| POST | `/guidelines/ask` | `guidelines.search` | Local evidence summary; doctor review required. |
| GET | `/guidelines/import-jobs` | `guidelines.import` | Import history. |
| GET | `/guidelines/update-checks` | `guidelines.import` | Update checks. |
| GET | `/guidelines/query-logs` | `guidelines.review` | Audited query review. |

## 13. Protocol Atlas

Controller: `ProtocolAtlasController`
Base: `/protocol-atlas`

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/protocol-atlas` | `protocol_atlas.read` | List permitted protocols. |
| GET | `/protocol-atlas/groups` | `protocol_atlas.read` | Group catalog. |
| GET | `/protocol-atlas/by-code/:code` | `protocol_atlas.read` | Resolve canonical code. |
| GET | `/protocol-atlas/:id` | `protocol_atlas.read` | Detail. |
| POST | `/protocol-atlas/search` | `protocol_atlas.read` | Filtered search. |
| GET | `/protocol-atlas/:id/editor` | `protocol_atlas.manage` | Editor payload. |
| PATCH | `/protocol-atlas/:id/status` | `protocol_atlas.manage` | Status update. |
| PATCH | `/protocol-atlas/:id/source` | `protocol_atlas.manage` | Source metadata. |
| PATCH | `/protocol-atlas/:id/aliases` | `protocol_atlas.manage` | Aliases. |
| PATCH | `/protocol-atlas/:id/structured-content` | `protocol_atlas.manage` | Structured content. |
| PATCH | `/protocol-atlas/:id/completion` | `protocol_atlas.manage` | Completeness state. |
| POST | `/protocol-atlas/:id/request-verification` | `protocol_atlas.manage` | Request review with reason. |
| POST | `/protocol-atlas/:id/verify` | `protocol_atlas.manage` | Verify with reason. |
| POST | `/protocol-atlas/:id/retire` | `protocol_atlas.manage` | Retire with reason. |

Safety contract:

- `verified`, `draft`, `catalog_only` and `retired` are materially different states.
- Catalog-only/draft content must not generate management output presented as verified.

## 14. Administration and governance

Frontend-confirmed endpoint groups:

### Accounts

- GET/POST `/admin/accounts`.
- PATCH `/admin/accounts/:id`.
- PATCH `/admin/accounts/:id/permissions`.
- POST `/admin/accounts/:id/reset-password`.
- POST `/admin/accounts/:id/activate`.
- POST `/admin/accounts/:id/deactivate`.
- POST `/admin/accounts/:id/revoke-sessions`.
- POST `/admin/accounts/:id/lock`.
- POST `/admin/accounts/:id/unlock`.
- POST `/admin/accounts/:id/2fa-reset/prepare`.
- POST `/admin/accounts/:id/2fa-reset/confirm`.
- GET `/admin/accounts/:id/audit-history`.
- POST `/admin/accounts/me/change-password`.

### Services/pricing

- GET/POST `/admin/services`.
- PATCH `/admin/services/:id`.
- POST `/admin/services/:id/deactivate`.
- POST `/admin/services/:id/reactivate`.

### Settings/appearance

- GET/PATCH `/admin/settings/clinic-profile`.
- GET/PATCH `/admin/settings/appearance`.
- PATCH `/users/me/preferences` for account-level appearance.

### Security/audit

- GET `/admin/security-readiness`.
- GET `/admin/audit?page=&pageSize=&q=&severity=&resourceType=`.

Golden Master rule:

- All destructive or high-risk governance actions retain mandatory reasons, protected-account checks and audit entries.

## 15. Printing contracts

### A5 prescription

Frontend route: `/prescriptions/:id/print`
API: GET `/prescriptions/:id/print`

Required payload:

- Patient identity and MRN.
- Date/age.
- Doctor identity.
- Ordered medication lines.
- Structured directions/instructions.
- Notes.
- Approved/signed status as enforced by service.

### Investigation request

Frontend route: `/clinical-requests/:id/print`
API: GET `/clinical-requests/:id/print`

Required payload:

- Patient identity and MRN.
- Doctor identity.
- Request date/reference.
- Investigation items and categories.
- Clinical indication.
- Requested follow-up date.

Runtime verification must confirm A4/A5 page geometry, Arabic direction, background assets and browser print settings.

## 16. Cross-module events and invariants

The Golden Master must preserve these integration events/invariants even if internal implementation changes:

- Patient created.
- Patient updated.
- Appointment created/status changed.
- Patient checked in.
- Queue called/selected/completed/cancelled.
- Encounter started/updated/completed/voided.
- Prescription created/signed.
- Investigation request created/result received/reviewed/cancelled.
- Ultrasound created/reviewed/signed/amended.
- Invoice created/issued/voided.
- Payment recorded/reversed/refunded.
- Follow-up task created/completed.
- Audit entry written for protected actions.

## 17. Runtime API capture still required

Before coding the identical copy, capture for every critical endpoint:

- HTTP method and full proxied URL.
- Request headers excluding secrets.
- Request DTO example using non-sensitive local QA data.
- Success status and response shape.
- 400 validation response.
- 401 session response.
- 403 permission response.
- 404/not-found response where applicable.
- 409 duplicate/conflict response where applicable.
- 429 throttled response for auth where safely testable.
- 5xx/safe UI behavior without causing data damage.

Do not export cookies, passwords, patient PHI/PII, `.env` values, private document contents or raw production-like database dumps into the Golden Master documentation.
