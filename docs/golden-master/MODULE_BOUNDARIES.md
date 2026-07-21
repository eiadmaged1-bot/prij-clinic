# Golden Master Module Boundaries

## Purpose

This document defines how the current Prij application will be divided after the identical Golden Master is approved. It prevents menu upgrades from duplicating shared services, changing clinical lifecycle rules, leaking permissions, or breaking neighboring modules.

Baseline source: `47c39e4478c9d91231bcdf05bdbcc7c63e597660`

## Boundary principles

1. **Clone before redesign.** Module extraction begins only after screenshot and behavior parity is accepted.
2. **One owner per domain state.** A module may read related state but cannot directly mutate another module’s entities.
3. **Shared foundations stay shared.** Shell, session, i18n, permissions, patient identity, autosave and event contracts are not copied into menu folders.
4. **Server authorization is authoritative.** Navigation visibility never replaces backend guards.
5. **Patient and encounter context are explicit.** Clinical write modules require locked patient/encounter identity.
6. **Clinical AI remains assistive.** AI output is a draft, source-aware, auditable and doctor-approved.
7. **Historical records are not deleted by UI refactors.** Deactivate/archive/void lifecycle rules remain intact.
8. **Print is a product surface.** A4/A5 routes are module contracts, not a browser afterthought.

## Proposed package layers

```text
apps/
  web/                         application composition and routes
  api/                         domain APIs and orchestration

packages/
  app-shell/                   shell, navigation, topbar, account menu
  auth-session/                session lifecycle and safe role routing
  design-system/               shared visual and interaction primitives
  i18n/                        translation and RTL contracts
  access-control/              shared action policy and role helpers
  patient-core/                identity, picker, workspace host, timeline events
  clinical-context/            patient/encounter lock and visit context
  print-core/                  A4/A5 foundations and direction helpers
  integration-events/          typed cross-module refresh/domain events

modules/
  reception/
  patient-directory/
  appointments/
  queue/
  doctor-dashboard/
  patient-workspace-panels/
  encounters/
  prescriptions/
  investigations/
  ultrasound/
  pregnancy/
  clinical-search/
  billing/
  documents-consents/
  tasks-messaging/
  reports/
  guidelines/
  protocol-atlas/
  pharmacology/
  dermatology/
  ai-assistance/
  owner-control/
  admin-accounts/
  admin-services/
  admin-catalogs/
  admin-settings/
  security-audit/
```

This is a target ownership map, not a command to reorganize the repository before Golden Master approval.

## Shared core contracts

### Application shell

Owns:

- Sidebar and mobile drawer.
- Role-aware navigation composition.
- Topbar, global search and account menu.
- Language, appearance and logout access.
- Auth loading and unauthorized redirects.
- Minimalistic role bottom navigation.

May not own:

- Domain data fetching.
- Patient or clinical records.
- Menu-specific forms.

Consumers:

- Every authenticated route.

### Auth/session

Owns:

- Login/logout/current session.
- Session expiry and return URL.
- CSRF/session transport integration.
- Safe post-login landing.

May not own:

- Domain permissions or menu-specific authorization rules.

### Design system

Owns:

- Tokens, typography, spacing, buttons, cards, tables, forms, tabs, drawers, dialogs, empty/loading/error states and print primitives.

May not own:

- Domain wording or clinical decisions.

### Access control

Owns:

- Shared role/permission helpers.
- Permission-aware action rendering.
- Role landing and route-entry policy.

May not own:

- Backend authorization decisions.

### Patient core

Owns:

- Canonical patient identity presentation.
- Shared PatientPicker.
- Patient workspace host/registry/layout.
- Patient timeline refresh orchestration.
- Reception versus clinical patient-shell selection.
- Missing-information host.

May not own:

- Detailed prescription, investigation, ultrasound or billing editors.

### Clinical context

Owns:

- Patient/encounter lock.
- Active visit start/resume.
- Context mismatch blocking.
- Visit module routing.
- Visit completion/void orchestration.

May not own:

- Medication reference data.
- Investigation catalog governance.
- Billing.

## Menu module contracts

## 1. Reception

Routes:

- `/reception`
- `/reception/check-in`
- `/reception/qr-scan`

Owns:

- Reception home.
- New/returning patient entry points.
- Check-in form and confirmation.
- Reception workflow summaries.

Reads:

- Patient search.
- Today queue.
- appointments where permitted.

Writes:

- Queue check-in.
- Patient creation/appointment where explicitly permitted.

Emits:

- `patient.created`
- `appointment.created`
- `queue.changed`

Must not expose:

- Clinical notes, prescriptions, investigation results, owner pricing or doctor-only panels.

## 2. Patient directory

Routes:

- `/patients`
- `/patients/new`
- `/patients/import`

Owns:

- Patient list/search/filter/sort/favorites.
- Registration and duplicate prevention.
- Import review UI.

Reads/writes:

- Canonical patient APIs only.

Must not own:

- Patient clinical panel implementations.

## 3. Appointments and calendar

Routes:

- `/appointments`
- `/calendar`

Owns:

- Appointment create/detail/status/calendar views.
- Schedule presentation.

Reads:

- Patient identity.
- doctor/branch context.

Emits:

- `appointment.created`
- `appointment.changed`

Must not directly:

- Check in a patient without queue domain action.
- Start an encounter.

## 4. Queue and waiting room

Routes:

- `/queue`
- `/doctor/waiting`

Owns:

- Today queue rendering.
- call/select/complete/cancel actions.
- wait-duration and priority presentation.
- doctor preview handoff.

Reads:

- Patient identity.
- appointment reason/status.

Emits:

- `queue.changed`

Must not:

- Create clinical documentation.
- Start an encounter except through clinical-context orchestration after queue selection.

## 5. Doctor dashboard

Route:

- `/doctor`

Owns:

- Current patient, waiting list, today appointments, pending results, due follow-ups and recent activity summaries.

Reads only:

- queue, appointments, results, tasks and encounters.

Actions:

- Open patient.
- Open waiting list.
- Start/resume via clinical-context service.

Must not own:

- Queue lifecycle implementation.
- Encounter editor.

## 6. Patient workspace

Route:

- `/patients/:id`

Owns:

- Host, registry, permissions, layout, identity and module composition.

Panel packages provide:

- `key`
- labels and translations
- icon
- role and permission requirements
- applicable patient contexts
- loading strategy
- supported sizes
- data source
- missing-data rules
- refresh dependencies
- render component
- action IDs

Must not:

- Hardcode every domain editor into the host.
- Render unavailable panels and merely disable them afterward.

## 7. Encounters and active visit

Routes:

- `/patients/:patientId/visits/:encounterId/:module`

Owns:

- Encounter, complaint, history, examination, impression, follow-up and finish/print modules.
- context lock.
- draft persistence.
- void action.

Consumes module adapters from:

- prescriptions.
- investigations.
- ultrasound.

Emits:

- `encounter.started`
- `encounter.changed`
- `encounter.completed`
- `encounter.voided`

## 8. Prescriptions

Routes:

- `/prescriptions`
- `/prescriptions/:id/print`
- active-visit prescription adapter.
- patient workspace prescription panel.

Owns:

- Prescription drafts and structured lines.
- templates and shortcuts.
- duplicate line prevention.
- review/sign/print gating.

Reads:

- patient identity.
- encounter identity.
- allergy/medication/pregnancy context.
- medication reference and safety results.

Writes:

- prescription entities only.

Must not:

- Automatically prescribe or dose.
- Modify the medication reference database from a prescription screen.

## 9. Investigations

Routes:

- `/investigations`
- `/clinical-requests/:id/print`
- active-visit adapter.
- patient workspace investigation panel.

Owns:

- catalog browse.
- basket draft.
- clinical request lifecycle.
- favorite sets.
- result follow-up.
- request printing.

Reads:

- patient/encounter identity.
- prior active requests/results.

Writes:

- investigation catalog favorites/sets and request/order entities only.

Must not:

- Treat applying a set as submission.
- Treat result received as doctor reviewed.

## 10. Ultrasound

Routes:

- `/ultrasound`
- `/ob-ultrasounds`
- patient-linked ultrasound routes.
- active-visit adapter.

Owns:

- scan history and filters.
- structured scan editor.
- study lifecycle and amendments.
- image/study metadata presentation.

Reads:

- patient context.
- pregnancy/fertility context.
- branch/operator.

Writes:

- ultrasound study entities only.

## 11. Pregnancy and fertility

Routes/panels:

- `/pregnancies`
- patient pregnancy panel.
- patient infertility panel.

Owns:

- pregnancy episodes.
- fetuses.
- antenatal visits.
- previous pregnancies.
- clinical dating state.
- infertility episodes/cycles/monitoring/E2/AMH.

Shares with ultrasound:

- patient context and dating/cycle references, not direct state mutation.

## 12. Billing and payments

Route:

- `/billing`

Owns:

- invoices, services consumed for billing, payments, statements, closing and reports.

Reads:

- patient identity.
- visit/service references.

Writes:

- invoice/payment entities only.

Must not:

- Change clinical visit content.
- Store card numbers or gateway secrets in manual notes.
- Allow void/refund without permission and reason.

## 13. Guidelines

Routes:

- `/guidelines` and subroutes.

Owns:

- source/document/import/review/search/secure-file lifecycle.

Must not:

- Present generated summaries without provenance/review state.
- expose private files through public URLs.

## 14. Protocol Atlas

Routes:

- `/protocol-atlas` and detail/editor routes.

Owns:

- protocol catalog, structured content and verification lifecycle.

Must not:

- Present draft/catalog-only protocols as verified management guidance.

## 15. Pharmacology and Dermatology

Routes:

- `/medications`
- `/dermatology`

Owns:

- reference profiles, search, browse, compare and interactions.

May link to:

- patient cohorts.
- active prescription draft.

Must not:

- Create a prescription without patient/encounter context and doctor action.

## 16. Documents, consents, tasks, reports and staff chat

These remain separate domain packages even when surfaced inside patient workspace.

Each owns:

- its entity lifecycle.
- permission checks.
- patient/encounter links.
- audit behavior.

Patient workspace owns only composition and presentation.

## 17. AI assistance

Owns:

- draft note summary.
- medical-history summary.
- OCR extraction draft.
- appointment assistance.
- follow-up reminder suggestions.
- search assistance.
- task automation proposals.
- safety flags.

Mandatory contract:

```text
Source data
  -> prompt-injection screening
  -> scoped model request
  -> structured draft with provenance
  -> safety validation
  -> doctor review/edit
  -> explicit approval
  -> audited save to record
```

Must never:

- silently write a signed clinical record.
- autonomously diagnose, prescribe, dose or select treatment.
- bypass patient/encounter scope.
- expose PHI to an unapproved provider.

## 18. Owner and Admin

Owner Control owns composition and metrics, not every management implementation.

Independent management modules:

- accounts and permissions.
- services and pricing.
- investigation catalog.
- medication data governance.
- clinic settings.
- appearance.
- security readiness.
- audit.
- backups/sync readiness.

All high-risk actions require:

- explicit permission.
- direct-route protection.
- reason where current contract requires it.
- audit event.
- protected-account/final-owner rules where applicable.

## Integration event catalog

Recommended typed event names for preserving current refresh semantics:

```text
patient.created
patient.updated
patient.favorite.changed
appointment.created
appointment.changed
queue.changed
encounter.started
encounter.changed
encounter.completed
encounter.voided
prescription.changed
prescription.signed
investigation.changed
result.changed
ultrasound.changed
pregnancy.changed
fertility-cycle.changed
invoice.changed
payment.changed
consent.changed
document.changed
task.changed
guideline.changed
protocol.changed
security-readiness.changed
```

Events signal refresh/integration. They do not grant authorization or carry unrestricted PHI.

## Dependency direction

Allowed:

```text
menu module
  -> shared core
  -> domain client
  -> API contract
```

Allowed cross-domain integration:

```text
module A
  -> typed orchestration service/event
  -> module B refresh/read
```

Rejected:

```text
module A imports module B page internals
module A writes module B database table directly
module A copies shared patient/session/permission logic
```

## Module upgrade branch contract

Every upgrade branch must declare:

```text
Module:
Source baseline commit:
Owned routes:
Owned components:
Shared dependencies:
Read endpoints:
Write endpoints:
Required permissions:
Emitted events:
Consumed events:
Out-of-scope routes:
Database entities touched:
Print impact:
Mobile/RTL impact:
Security/AI risks:
Rollback path:
```

Recommended naming:

```text
upgrade/reception-workspace-v1
upgrade/patient-directory-v1
upgrade/doctor-dashboard-v1
upgrade/patient-workspace-v1
upgrade/prescriptions-v1
upgrade/investigations-v1
```

## Integration gate

A module is eligible for the integration branch only when:

- Its Golden Master baseline screenshots are linked.
- Intentional changes are documented.
- No shared-core fork was introduced.
- Role and permission tests pass.
- Domain lifecycle tests pass.
- Cross-module event tests pass.
- Desktop/mobile/RTL tests pass.
- Print tests pass where relevant.
- Audit and idempotency tests pass where relevant.
- No PHI/PII or secret leakage is introduced.
- Clinical AI output remains draft-only and approval-gated.
