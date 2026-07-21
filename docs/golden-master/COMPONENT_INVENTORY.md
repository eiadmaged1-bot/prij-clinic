# Golden Master Component Inventory

## Baseline

- Repository: `eiadmaged1-bot/prij-clinic`
- Source freeze: `baseline/prij-v1.5.3-source-freeze`
- Source commit: `47c39e4478c9d91231bcdf05bdbcc7c63e597660`
- Inventory branch: `work/golden-master-inventory`
- Inventory status: **SOURCE VERIFIED / RUNTIME CAPTURE PENDING**

This document maps the current application components before any redesign, extraction, or module upgrade. The Golden Master must preserve this hierarchy and behavior. A plain-HTML or modular implementation may change technology, but it must not silently replace these components with generic cards, tables, icons, or workflows.

## 1. Application foundation

| Responsibility | Current source | Classification | Golden Master rule |
|---|---|---|---|
| Root providers | `apps/web/app/layout.tsx` | Shared core | Preserve global provider order and behavior: i18n, theme, session, interface mode. |
| Authenticated shell | `apps/web/app/mvp-page.tsx` | Shared core | One canonical shell. Menus must not ship independent sidebars or top bars. |
| Session lifecycle | `apps/web/app/session.tsx` | Shared core | Preserve authenticated/loading/expired states and return URL behavior. |
| Theme system | `apps/web/app/theme.tsx` | Shared core | Preserve theme ID, configuration, role/device/account/clinic precedence. |
| Interface mode | `apps/web/lib/interface-mode.tsx` | Shared core | Preserve OPTIMIZED/MINIMALISTIC visibility and density behavior. |
| Role routing | `apps/web/lib/role-routing.ts` | Shared core | Preserve role landing and direct-route denial. |
| Navigation registry | `apps/web/app/navigation-registry.ts` | Shared core | Menu visibility remains registry and permission driven. |
| Icons | `apps/web/components/ThreeDMedicalIcon.tsx` | Shared design primitive | Do not substitute Unicode characters or unrelated icon libraries in the identical copy. |
| Global search | `apps/web/components/clinic/UniversalSearchBox.tsx` | Shared core | Preserve scope-aware search placement and keyboard/mobile behavior. |
| Language switcher | `apps/web/i18n/useI18n.tsx` | Shared core | Preserve English/Arabic state, RTL direction, and visible language access. |
| Mobile navigation | `apps/web/components/layout/MobileBottomNav.tsx` | Shared core | Preserve role-specific minimalistic mobile navigation. |
| Action authorization | `apps/web/components/actions/AppActionButton.tsx` | Shared security primitive | UI actions must remain permission-aware; API authorization remains authoritative. |
| Safe errors | `apps/web/lib/safe-api-error.ts` | Shared safety primitive | No raw stack traces, storage paths, secrets, or internal exception payloads in normal UI. |
| Idempotency | `apps/web/lib/idempotency-key.ts` | Shared data-safety primitive | Preserve for duplicate-sensitive writes such as queue check-in and payment. |
| Data refresh events | `apps/web/lib/clinic-data-events.ts` | Shared integration primitive | Preserve cross-module refresh dependencies without tightly coupling page internals. |
| Local autosave | `apps/web/lib/autosave-draft.ts` | Shared resilience primitive | Preserve local draft, retry, offline/sync state, and patient/encounter scoping. |

## 2. Shared visual primitives

The current design contract identifies these as shared primitives or functional equivalents:

- `PageShell`
- `PageHeader`
- `CompactKpiCard`
- `SectionCard`
- `Tabs`
- `SegmentedControl`
- `EmptyState`
- `PatientIdentityBar`
- `ClinicalTagCard`
- `FilterDrawer`
- `ActionToolbar`
- `SplitPane`
- `Stepper`
- `DataTable`
- `UserMenu`

Important styling constraints:

- Warm ivory canvas.
- Deep green/navy navigation.
- White cards.
- Teal primary actions.
- Muted gold only for limited owner/premium accents.
- Desktop sidebar target 240–260px.
- Main content uses a 12-column grid with 1440–1600px maximum width.
- Spacing scale: 4, 8, 12, 16, 24, 32px.
- Compact KPI target: 96–112px.
- Mobile/tablet navigation is a closed-by-default drawer.
- Dedicated print routes do not inherit application navigation.

## 3. Authentication and shell components

### Login

Source:

- `apps/web/app/login/page.tsx`

Owned behavior:

- English/Arabic login copy.
- Language switcher before authentication.
- Current-session state.
- Account switching.
- Safe return URL routing.
- Credential, connection, loading, and authenticated states.

Split rule:

- Login may be a module package, but session, i18n, brand, and role-routing contracts remain shared core.

### App shell

Source:

- `apps/web/app/mvp-page.tsx`

Owned behavior:

- Role-aware sidebar groups.
- Collapsible desktop navigation.
- Mobile drawer and backdrop.
- Escape and swipe-close behavior.
- Global search.
- Account sheet/menu.
- Appearance and language access.
- Logout.
- Authorization-pending skeleton.
- Direct-route redirect.
- Minimalistic doctor/reception bottom navigation.

Split rule:

- No menu module may fork or locally redefine shell behavior.

## 4. Reception module

Primary sources:

- `apps/web/app/reception/page.tsx`
- `apps/web/app/reception/check-in/page.tsx`
- `apps/web/app/reception/qr-scan/page.tsx`
- `apps/web/app/reception/reception-copy.ts`

Shared dependencies:

- `AppShell`
- `PatientPicker`
- `VisitTypeSelector`
- `ThreeDMedicalIcon`
- idempotency key
- clinic data refresh events
- safe API errors
- i18n

Owned behavior:

- Reception home actions.
- Queue preview.
- New-patient handoff.
- Returning-patient search and permanent QR handoff.
- Visit type selection.
- Check-in confirmation and queue number.
- Reception-only patient profile rendering.

Does not own:

- Patient search implementation.
- Queue lifecycle implementation.
- Doctor clinical screens.
- Billing authorization.

## 5. Patient directory module

Primary source:

- `apps/web/app/patients/page.tsx`

Shared dependencies:

- App shell.
- i18n.
- patient labels.
- session role context.
- safety alert.

Owned behavior:

- All/today/waiting/recent/favorites views.
- Name, phone, MRN and route-provided search.
- Patient type and branch filters.
- Sorting and pagination.
- Favorite toggle.
- Desktop table and mobile card layouts.
- Owner/Admin import entry point.
- Open patient and queue actions.

Split rule:

- Directory owns list presentation, not canonical patient lookup, patient identity, or patient clinical modules.

## 6. Shared patient selection

Primary source:

- `apps/web/components/clinic/PatientPicker.tsx`

Used by:

- Reception check-in.
- Prescription and clinical request workflows.
- Other patient-attached records.

Owned behavior:

- Live permitted patient search.
- Search debounce and minimum length.
- Pagination/load more.
- Selected-patient summary.
- Session-preserved query and scroll.
- Permission, loading, empty and service-error states.
- Explicit patient selection.

Split rule:

- This remains one shared component/service. Do not duplicate it inside each menu.

## 7. Patient workspace module

Primary sources:

- `apps/web/app/patients/[id]/page.tsx`
- `apps/web/app/patients/[id]/patient-components.tsx`
- `apps/web/app/patients/[id]/workspace-module-renderer.tsx`
- `apps/web/components/patients/patient-workspace-registry.ts`
- `apps/web/components/patients/PatientSmartIdentityBar.tsx`
- `apps/web/components/patients/MissingInformationCenter.tsx`
- `apps/web/components/patients/PatientPanelErrorBoundary.tsx`
- `apps/web/components/patients/PatientWorkspaceEditor.tsx`

Shared dependencies:

- App shell and session.
- Patient identity.
- permission/role context.
- autosave.
- patient workspace refresh events.
- active visit launcher.
- i18n and interface mode.

Registry-defined modules:

- Patient summary.
- History.
- Current visit.
- Allergies.
- Active medications.
- Recent prescriptions.
- Investigations and results.
- Pregnancy and women’s health.
- Documents.
- Finance.
- Timeline.
- More.
- Consents.
- Infertility and cycle monitoring.
- Ultrasound.
- Reports.
- Internal notes.
- Tasks and reminders.
- Referrals.
- Review hints / Care Assist.

Owned behavior:

- Patient workspace summary.
- Role-specific patient presentation.
- Configurable panel placement, size, pin, hide and collapse.
- Panel-level permission checks.
- Patient context identity lock.
- Missing-information decisions.
- Timeline pagination.
- Module-specific refresh dependency handling.
- Panel error isolation.
- Reception-only profile divergence.

Split rule:

- The Patient Workspace is a host platform. Individual clinical panels may become module packages, but the workspace registry, identity bar, permissions, layout and refresh orchestration remain shared patient core.

## 8. Doctor dashboard and queue handoff

Primary sources:

- `apps/web/app/doctor/page.tsx`
- `apps/web/app/doctor/waiting/page.tsx`
- `apps/web/app/queue/page.tsx`
- `apps/web/app/calendar/page.tsx`
- `apps/web/app/clinic-operations-page.tsx`

Shared dependencies:

- App shell.
- active visit launcher.
- patient search.
- queue refresh events.
- role/permission actions.

Owned behavior:

- Doctor operational KPIs.
- Current patient.
- Waiting patients.
- Recent encounters.
- Appointment, result and follow-up counts.
- Queue board.
- Doctor preview versus Start Visit.
- Queue select/call/complete/cancel transitions.
- Operational calendar/report views.

Split rule:

- Queue, calendar and doctor waiting share one operational engine. Upgrade them through defined subviews, not cloned page implementations.

## 9. Active visit module

Primary sources:

- `apps/web/components/clinic/ActiveVisitWorkspace.tsx`
- `apps/web/components/clinic/PatientVisitIdentityBar.tsx`
- `apps/web/lib/doctor-visit.ts`
- dynamic routes under `apps/web/app/patients/[id]/visits/[encounterId]/...`

Visit modules:

1. Encounter.
2. Complaint.
3. History.
4. Examination.
5. Impression.
6. Prescription.
7. Investigations.
8. Ultrasound.
9. Follow-up.
10. Finish / Print.

Owned behavior:

- Patient and encounter context lock.
- Start/resume visit.
- Draft update.
- Examination chips.
- Visit-linked prescription draft.
- Visit-linked investigation handoff.
- Follow-up creation.
- Print packet.
- Auditable encounter void with mandatory reason.

Split rule:

- The locked visit context and module router remain shared clinical core. Prescription, investigation and ultrasound editors may be module-owned but cannot bypass the locked patient/encounter contract.

## 10. Prescription module

Primary sources:

- `apps/web/app/prescriptions/page.tsx`
- `apps/web/components/patients/PatientClinicalWorkflowPanels.tsx`
- prescription section inside `ActiveVisitWorkspace.tsx`
- `apps/web/app/prescriptions/[id]/print/page.tsx`

Submodes:

- Standalone template library.
- Saved medication shortcuts.
- Recent prescriptions.
- Patient-and-encounter-locked builder.
- Signed A5 print route.

Owned behavior:

- Generic/brand/trade search.
- Medication line ordering and removal/undo.
- Complete structured dispensing fields.
- Template CRUD/duplicate/archive.
- Shortcut CRUD/archive.
- Duplicate-medication prevention.
- Patient-context hints.
- Doctor review and alert-handling confirmation.
- Sign-before-print gate.
- A5 printing.

Does not own:

- Medication reference profiles.
- Medication safety engine.
- Patient identity.
- Encounter lifecycle.

## 11. Investigations module

Primary sources:

- `apps/web/app/investigations/page.tsx`
- `apps/web/components/patients/PatientClinicalWorkflowPanels.tsx`
- investigation section inside `ActiveVisitWorkspace.tsx`
- `apps/web/app/clinical-requests/[id]/print/page.tsx`

Submodes:

- Encounter-locked ordering.
- Catalog and favorite-set selection.
- Result follow-up.
- Personal reusable sets.
- Admin catalog governance.
- Dedicated print request.

Owned behavior:

- Search and category browse.
- Persistent local and server draft basket.
- Add, remove, undo and reorder.
- Per-item indication.
- Priority, internal/external, expected date and responsibility.
- Duplicate-active-order and prior-result warnings.
- Separate apply-set and submit actions.
- Follow-up state transitions.
- Catalog CRUD and deactivate/restore.

## 12. Ultrasound and pregnancy modules

Primary sources:

- `apps/web/app/ultrasound/page.tsx`
- `apps/web/app/ob-ultrasounds/page.tsx`
- patient ultrasound routes under `apps/web/app/patients/[id]/ultrasounds/...`
- pregnancy components under patient workspace.

Owned behavior:

- Server-paginated scan history.
- Patient, status, clinical context, date, doctor and branch filters.
- Obstetric, gynecology and fertility context.
- Structured findings and measurement completeness.
- Draft, needs-review, signed, incomplete and amended lifecycle.
- Patient-linked scan editor/detail.
- Pregnancy episode, fetus and antenatal visit structures.

Split rule:

- Pregnancy episode and ultrasound study are separate domain entities but share patient context and clinical dating dependencies.

## 13. Billing module

Primary source:

- `apps/web/app/billing/page.tsx`

Owned behavior:

- Invoice creation.
- Service catalog selection or controlled manual line.
- Discount and required reason.
- Invoice issue and void.
- Manual payment with idempotency.
- Payment reversal/refund.
- Daily closing.
- Finance reports.
- Patient statement.
- Owner visit-price audit.

Split rule:

- Billing remains isolated from clinical write permissions. Patient/visit context may be referenced, but clinical modules must not directly modify invoice/payment state.

## 14. Knowledge modules

### Guideline Center

Primary sources:

- `apps/web/app/guidelines/GuidelineCenter.tsx`
- guideline routes under `apps/web/app/guidelines/...`

Owned behavior:

- Document inventory.
- Search and filtered synthesis.
- Evidence-only question answering.
- Source management.
- Upload/import/reindex/review/archive.
- Secure streamed view and conditional download.
- Private vault access.
- Local device favorites.

### Protocol Atlas

Primary sources:

- `apps/web/components/protocol-atlas/ProtocolAtlasBrowser.tsx`
- protocol detail/editor components.

Owned behavior:

- Search, grouping and status filtering.
- Verified/draft/catalog-only/retired distinctions.
- Source links.
- Structured content governance.
- Verification request, verification and retirement.

### Pharmacology Atlas

Primary sources:

- `apps/web/components/medications/PharmacologyWorkspace.tsx`
- compare and interactions components.

Owned behavior:

- Generic-first universal search.
- Rooms, generics and family browsing.
- Compare and interaction tools.
- Source-linked profiles.
- Explicit source-incomplete and source-conflict states.
- Pregnancy/lactation and renal/hepatic reference sections.
- Device favorites.

Split rule:

- These are reference/decision-support modules. They may link into patient workflows but never directly diagnose, prescribe, dose, or finalize records.

## 15. Owner and administration modules

### Owner Control

Primary source:

- `apps/web/app/admin/page.tsx`
- `/owner-control` aliases this page.

Owned behavior:

- Owner-only live metrics.
- Global patient search.
- Readiness summary.
- Pending task categories.
- Services preview.
- Recent audit.
- Management route launcher.

### Accounts and permissions

Primary source:

- `apps/web/app/admin/accounts/page.tsx`

Owned behavior:

- Account creation and editing.
- Role and permission presets.
- Reserved-permission protection.
- Protected System Owner safeguards.
- Activate/deactivate.
- Password reset/change.
- Session revocation.
- Lock/unlock.
- Two-stage 2FA reset.
- Per-account audit history.

### Services and pricing

Primary source:

- `apps/web/app/admin/services/page.tsx`

Owned behavior:

- Search/filter/sort/paginate.
- Create/edit through protected drawer.
- Price, cost and doctor-share fields.
- Audited deactivate/restore.

### Investigation catalog

Primary source:

- `apps/web/app/admin/investigations/page.tsx`

Owned behavior:

- Permission-gated catalog CRUD.
- Clinical group, modality and aliases.
- Deactivate/restore without deleting prior orders.

### Clinic settings

Primary source:

- `apps/web/app/admin/settings/page.tsx`

Owned behavior:

- Clinic identity.
- Schedule defaults.
- Billing defaults.
- Density default.
- Mandatory audit reason.

### Appearance

Primary source:

- `apps/web/app/admin/appearance/page.tsx`

Owned behavior:

- Interface mode and density.
- Device/account/role/clinic scopes.
- Theme and configuration.
- Doctor Comfort Mode.
- Corrupted-device reset.
- Audited shared settings.

### Security readiness and audit

Primary sources:

- `apps/web/app/admin/security-readiness/page.tsx`
- `apps/web/app/admin/audit/page.tsx`

Owned behavior:

- Automated/manual/mixed readiness evidence.
- Blocker ownership and actions.
- Explicit non-production limitations.
- Paginated, filtered and redacted audit review.

## 16. Print components

Confirmed dedicated routes:

- Prescription A5: `/prescriptions/:id/print`
- Investigation request: `/clinical-requests/:id/print`
- Additional patient/report print routes remain in route inventory and require runtime verification.

Golden Master rules:

- Print routes must not render the app shell.
- A5 and A4 page sizes must remain explicit.
- Arabic/English direction must be selected per content block where applicable.
- Only approved/signed content may reach protected print routes where the current workflow requires approval.
- Browser toolbars and print-only elements must be tested separately.

## 17. Component ownership classification

### Shared core — never duplicated by modules

- App shell and navigation.
- Session and authorization routing.
- i18n and RTL.
- Theme, density and interface mode.
- Patient identity and selection.
- Permission-aware actions.
- API base/proxy handling.
- safe errors.
- idempotency.
- autosave.
- refresh events.
- print foundations.

### Domain shared — one package per domain

- Patient workspace host.
- Queue/clinic operations engine.
- Active visit host.
- Medication reference and safety interfaces.
- Investigation catalog and request lifecycle.
- Guideline secure viewer.

### Module-owned

- Reception pages.
- Patient directory presentation.
- Doctor dashboard presentation.
- Prescription library/builder.
- Investigation library/follow-up.
- Ultrasound history/editor.
- Billing workspace.
- Guidelines, Protocol Atlas and Pharmacology views.
- Owner/Admin management pages.

## 18. Identical-copy rejection conditions

The Golden Master component pass fails if it:

- Replaces real icons with text symbols.
- Combines distinct screens into one generic renderer without preserving behavior.
- Removes role-specific variants.
- Omits loading, empty, permission, timeout or error states.
- Loses panel registry metadata or refresh dependencies.
- Permits clinical writing without patient/encounter context.
- Bypasses signing/review gates.
- Creates separate patient search implementations.
- Inherits the application shell on dedicated print routes.
- changes visual tokens before baseline approval.

## 19. Runtime verification still required

Source inspection verifies architecture and intended behavior, not the rendered appearance. The following remain manual/runtime gates:

- Exact computed dimensions and fonts.
- Current active theme/configuration from the local database/account/browser.
- Role-specific rendered navigation.
- Responsive breakpoints and overflow.
- Modal/drawer placement.
- Real loading/empty/error screenshots.
- Arabic/RTL visual correctness.
- A4/A5 printed output.
- Actual API response shapes from the current local database.
