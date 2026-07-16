# v1.5.1 live route audit

Captured before v1.5.1 product changes on 2026-07-16. This map identifies the component actually rendered by each production route; it is not a feature-completion claim.

| Route | Current rendered component | State | Current API/service | v1.5.1 route decision | Permission requirement |
| --- | --- | --- | --- | --- | --- |
| `/doctor` | `DoctorModePage` plus `ActiveVisitLauncher` | Current, compact home | queue, patient search, current doctor visit | Repair in place | Doctor/Owner/Admin visit permissions |
| `/reception` | `ReceptionHomePage` | Current | `/queue/today`, shared patient picker/search | Repair in place | patient read plus queue permissions |
| `/patients` | `PatientsPage` | Current but incomplete browse contract | `/patients` | Repair in place as browse-first directory | `patient.read` |
| `/patients/[id]` | `PatientFilePage` | Current; editor is incorrectly inline | workspace summary/layout, timeline and specialty APIs | Keep patient file; remove inline editor | `patient.read`; scoped clinical permissions |
| `/patients/[id]/visits/[visitId]/[[...module]]` | `ActiveVisitWorkspace` | Current, module-by-module visit route | doctor visit, prescriptions, clinical requests, medication safety | Repair in place and connect investigation/ultrasound workflows | visit/encounter clinical permissions |
| patient workspace editor | Inline `PatientWorkspaceEditor` inside `/patients/[id]` | Obsolete placement | `/patients/:id/workspace-layout` | Move to `/patients/[id]/workspace-editor` | user scope; elevated role/clinic scope permissions |
| `/doctor/case-library` | `DoctorCaseLibraryPage` | Current, scope contract incomplete | `/doctor/case-library` | Repair in place | clinician case scope; all-clinic permission where applicable |
| `/guidelines` and child library routes | `GuidelineCenter` | Current; older `GuidelineCenterClient` remains unused | `/guidelines/documents`, sources, search, ask, review | Keep one live `GuidelineCenter`; remove obsolete parallel layer | guideline read/manage/review by action |
| `/guidelines/[id]` | `GuidelineViewerPage` plus `PdfCanvasViewer` | Current, requires live PDF proof | document metadata and `/view` range endpoint | Repair visible viewer and verify actual stored PDF | guideline read/download permissions |
| `/protocol-atlas` | `ProtocolAtlasBrowser` | Current | `/protocol-atlas` search/editor/completion/version actions | Repair in place | clinical read; manage/review for mutations |
| `/investigations` | monolithic `InvestigationsPage` | Current but mixes ordering, follow-up and templates | investigation catalog/orders/drafts/sets/status | Replace with role-aware Investigation Center | investigation read/order/review/manage permissions |
| patient encounter investigation order | Inline section in `ActiveVisitWorkspace` | Legacy minimal basket; nonpersistent | catalog and `/clinical-requests` | Replace with encounter-persistent ordering workspace | Doctor order permission |
| `/ob-ultrasounds` (`/ultrasound` aliases it) | `ObUltrasoundsPage` | Current compact center, incomplete editor flow | `/ob-ultrasounds` lifecycle endpoints | Repair in place; add patient scan editor route | ultrasound read/review/sign permissions |
| patient ultrasound editor | No dedicated production route | Missing | pregnancy/ultrasound endpoints | Add `/patients/[id]/ultrasounds/[scanId]` | ultrasound create/edit/review/sign permissions |
| `/medications` | mode toggle rendering `PharmacologyWorkspace` or `DermatologyWorkspace` | Current but combined; dermatology has no stable route | `/pharmacology/*`, `/dermatology/*` | Keep Pharmacology at `/medications`; add dedicated `/dermatology` | medication/clinical knowledge read |
| `/dermatology` | No route | Missing | dermatology search/condition endpoints | Add dedicated workspace route | clinical knowledge read |
| `/external-intake` | `ExternalIntakePage` | Current | `/external-intake` review/actions | Repair into unified intake center | intake review/create permissions |
| `/patients/import` | `PatientImportPage` | Current | `/patient-import` preview/review/commit | Integrate as intake tab while preserving direct route | `patient.create` |
| `/admin` | `OwnerControlPage` | Current owner dashboard | `/dashboard/owner-control` | Repair cards and destinations in place | Owner/Admin |
| `/admin/appearance` | `AppearancePage` | Current | appearance clinic/account settings | Repair and browser-verify | account self; Owner/Admin for clinic/role scopes |
| `/admin/accounts` | `AccountsPage` | Current | `/admin/accounts` governance endpoints | Repair in place | Owner/Admin account management |
| `/admin/services` | `AdminServicesPage` rendering the entire `AdminPage` | Legacy/incorrect | owner dashboard instead of dedicated service workflow | Replace with dedicated services table/editor | service management |
| `/admin/investigations` | `InvestigationCatalogAdminPage` | Current, long list | `/investigations/admin/catalog` | Repair table/pagination/drawer | `investigations.manage_catalog` |
| `/admin/medications` | legacy `MedicationComponents` composition | Legacy production surface | medication family/profile/review APIs | Replace with governed medication data center | medication content management |
| `/admin/security-readiness` | `SecurityReadinessPage` | Current | `/admin/security-readiness` | Repair actionable evidence matrix | Owner/Admin |
| `/admin/audit` | `AdminAuditPage` | Current | `/admin/control-center` audit data | Repair paginated audit route | audit read |
| `/staff-chat` | `StaffChatPage` | Current | staff-chat directory/conversations/messages | Keep; add canonical `/messages` redirect | authenticated staff |
| `/messages` | No route | Missing canonical destination | staff-chat APIs | Redirect to `/staff-chat` | authenticated staff |

## Parallel or unused surfaces found

- `components/guidelines/GuidelineCenterClient.tsx` is an older parallel guideline surface and is not rendered by the live `/guidelines` route.
- `OptimizedPatientWorkspace` and `MinimalPatientWorkspace` are wrappers, not the live patient workspace implementation.
- `PatientWorkspaceEditor` is live but incorrectly mounted inline inside the patient profile.
- Dermatology is reachable only through transient component state on `/medications`; there is no durable route or back-navigation contract.
- `/admin/services` renders the entire Owner Control page rather than a service-management screen.
- `/ultrasound` is only an alias of the center; there is no dedicated structured patient scan editor route.

These findings define the replacement scope. New components must be imported by the listed live routes or the old route must explicitly redirect.

## Final route acceptance

Authenticated read-only Playwright acceptance on 2026-07-16 opened the mapped Doctor, Reception, Patient Directory, Case Library, Guidelines, Protocol Atlas, Investigations, Ultrasound, Medication, dedicated Dermatology, Intake, Owner, Appearance, Accounts, Services, Investigation Catalog, Security Readiness, Audit, and Messages/staff-chat production routes at 1440×900. Patient Directory, Guidelines, Investigations, Ultrasound, Medication, dedicated Dermatology, Intake, and Appearance also passed at 390×844 without page-level overflow.

The guideline document test selected an API-declared stored PDF asset, verified range and full responses, and observed an actual PDF.js canvas. Tests did not create or modify clinical records. See `tests/v151/read-only-live-routes.spec.ts` and `docs/V151_COMPREHENSIVE_CLINICAL_PRODUCT_RESCUE.md`.
