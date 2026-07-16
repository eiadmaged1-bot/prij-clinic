# v1.5.2 live route audit

Captured on 2026-07-17 before v1.5.2 product changes. This is a source-level map of the component actually imported by each production route. It is not a feature-completion claim.

| Route | Rendered component | API/service | Legacy/parallel reference | Feature flag | RBAC requirement | Required repair |
| --- | --- | --- | --- | --- | --- | --- |
| `/patients` | `PatientsPage` | `/patients`, patient favorites | None found | None | `patient.read` | Verify normalized patient types, truthful totals, pagination, and semantic cards |
| `/patients/[id]` | `PatientFilePage` and `WorkspaceModuleRenderer` | workspace summary/layout, timeline, specialty patient endpoints | **Inline `PatientWorkspaceEditor` is still rendered** | Interface mode only | Patient and scoped clinical read permissions | Remove inline editor; render saved specialty grid and one identity bar |
| `/patients/[id]/workspace-editor` | `PatientWorkspaceEditorPage` | `/patients/:id/workspace-layout`, presets, missing information | Shares editor with inline legacy placement | None | Personal scope; elevated role/specialty/clinic scope | Keep as the only editor surface; repair localization and controls |
| `/doctor` | `DoctorModePage` | `/queue/today`, patient search, current visit/results | None found | None | Doctor/Owner/Admin clinical permissions | Verify queue and patient-type context |
| `/doctor/case-library` | `DoctorCaseLibraryPage` | `/doctor/case-library` | None found | None | Clinician case scope | Verify subset invariant, counts and pagination |
| `/guidelines` | `GuidelineCenter` | guideline documents, sources, search, ask and review | Older `GuidelineCenterClient` remains outside live import | None | Guideline read/manage/review by action | Expand authoritative inventory and verify live search/source states |
| `/guidelines/[id]` | `GuidelineViewerPage` with `PdfCanvasViewer` | document metadata and range-capable `/view` | No text-only viewer imported | None | Guideline read/download | Verify every stored PDF, worker, canvas, thumbnails, search and truthful fallback |
| `/protocol-atlas` | `ProtocolAtlasBrowser` | protocol-atlas search/detail/version services | None found | None | Clinical reference read; manage/review for edits | Populate and expose structured source-verified references |
| `/investigations` | `InvestigationsPage` | catalog, sets, encounter draft and order status | Large page still combines center and ordering concerns | None | Investigation permissions by action | Split role-aware views and finish connected lifecycle |
| active visit investigation | `ActiveVisitWorkspace` | investigation catalog, orders and encounter modules | Minimal order UI remains embedded | None | Doctor order permission | Connect persistent encounter basket and confirmation |
| `/ob-ultrasounds` | `ObUltrasoundsPage` | `/ob-ultrasounds` | `/ultrasound` alias remains intentional | None | Ultrasound read/review/sign | Repair remaining center filters and specialty presentation |
| patient ultrasound editor | `UltrasoundEditorPage` | `/ob-ultrasounds/:id`, patient scan routes | None found | None | Ultrasound create/edit/review/sign | Complete structured templates, image/report and signing safeguards |
| `/medications` | `MedicationCenterPage` with `PharmacologyWorkspace` | pharmacology search/detail/safety endpoints | **Still embeds `DermatologyWorkspace` as a mode** | Local component state | Medication knowledge read | Make Drug Atlas the canonical route; link to dedicated Dermatology route |
| `/dermatology` | `DermatologyPage` with `DermatologyWorkspace` | `/dermatology/atlas`, medication search | Same workspace also embedded in `/medications` | None | Clinical knowledge read | Keep canonical route; expand source-backed topics and navigation |
| `/external-intake` | `ExternalIntakePage` | external intake actions and patient picker | Direct `/patients/import` remains supported | None | Intake review/create | Verify intake center and exact-phone import contract |
| `/owner-control` | owner-control page re-export | owner dashboard | `/admin` is the administrative shell | None | Owner/Admin | Verify connected destinations and real metrics |
| `/admin/appearance` | `AppearancePage` | `/admin/settings/appearance` | None found | None | Self; Owner/Admin for broader scopes | Preserve semantic patient-type colors and repair localization/preview |
| `/admin/services` | `AdminServicesPage` | `/admin/services` | Old owner-dashboard composition is no longer imported | None | Service management | Verify pagination/table editor |
| `/admin/investigations` | `InvestigationCatalogAdminPage` | `/investigations/admin/catalog` | None found | None | `investigations.manage_catalog` | Keep catalog management separate from Doctor ordering |
| `/admin/accounts` | accounts governance page | `/admin/accounts` and session/password actions | None found | None | Owner/Admin | Verify final-Owner protection and audit |

## Baseline data and safety evidence

- Approved base: `c8174e413ddc7a352894d5736fc45cf5c64e268d` on `fix/v1.5.1-comprehensive-clinical-product-rescue`; worktree clean.
- v1.5.2 branch: `fix/v1.5.2-clinical-content-and-smart-workspace-completion`.
- Verified local PostgreSQL backup: `backups/prij-clinic-local-20260717-013714.backup.sql`, 28,934,813 bytes, SHA-256 `510E0097D5B2A05293887866344CE1CF76E4BDC5085C3B3EEB002661D992F634`.
- Backup validation found the PostgreSQL dump header and completion marker. The ignored backup is not committed.
- Prisma reports 77 migrations and an up-to-date schema.
- Aggregate counts are recorded separately in the v1.5.2 completion report; no PHI was printed during capture.

## Immediate route findings

1. The dedicated workspace editor exists, but the patient profile still renders the same editor inline. The patient profile must become a pure saved-layout consumer.
2. `/dermatology` exists, but `/medications` still embeds Dermatology as a parallel local-state mode. The canonical routes must be explicit and durable.
3. The workspace registry contains mojibake Arabic labels and legacy patient-context values. Both require a compatibility layer and central localization before browser acceptance.
4. The live Guidelines route does import the current Knowledge Center and the viewer imports `PdfCanvasViewer`; content expansion and multi-document PDF acceptance still remain.
