# Golden Master Role and Permission Matrix

## Purpose

This document records the frozen v1.5.3 frontend role-routing and menu-visibility contracts. It is not yet a complete backend RBAC audit. Backend controller guards and permission decorators will be added during the API contract inventory.

## Canonical role landing

| Identity | Landing route |
|---|---|
| Owner | `/owner-control` |
| Admin | `/owner-control` |
| Super Admin | `/owner-control` |
| Doctor | `/doctor` |
| Reception | `/reception` |
| Receptionist | `/reception` |
| Other authenticated role | `/dashboard` |

Owner/Admin status can also be granted by the permissions `clinic_settings.manage` or `user.manage` in the frontend role-routing helper.

## Coarse workspace authorization

| Workspace | Allowed identities |
|---|---|
| `/doctor`, `/doctor/*` | Owner/Admin/Super Admin, Doctor |
| `/reception`, `/reception/*` | Owner/Admin/Super Admin, Reception/Receptionist |
| `/owner-control`, `/owner-control/*` | Owner/Admin/Super Admin |
| `/admin`, `/admin/*` | Owner/Admin/Super Admin |
| Other routes | Frontend helper allows navigation; menu visibility and backend permissions still apply |

## Receptionist menu contract

| Menu | Route | Required permission |
|---|---|---|
| Home | `/reception` | `queue.read` |
| New Patient | `/patients/new` | `patient.create` or `patient.manage` |
| Returning Patient / QR | `/reception/qr-scan` | `appointment.read` or `queue.manage` |
| Waiting Line | `/queue` | `queue.read` |

Receptionist-only shell behavior identified in the shared shell:

- receives `receptionist-shell` CSS class
- does not persist desktop collapsed-sidebar state
- menu control uses receptionist styling and iconography
- is redirected away from unauthorized doctor/admin workspaces
- may use the receptionist minimalistic mobile bottom navigation when interface mode is `MINIMALISTIC`

## Doctor menu contract

| Menu | Route | Required permissions |
|---|---|---|
| Today / Waiting | `/doctor` | `encounter.read`, `queue.read` |
| Patients | `/patients` | `patient.read` |
| Case Library | `/doctor/case-library` | `clinical_case_library.view_own` |
| Guidelines | `/guidelines` | `guidelines.read`, `guidelines.search` |
| Prescriptions | `/prescriptions` | `prescription.read` |
| Investigations | `/investigations` | `investigation.read` |
| Ultrasound | `/ultrasound` | `ob_ultrasound.read` or `ob_ultrasound.manage` |
| Encounters | `/encounters` | `encounter.read` |
| Reports | `/reports` | `report.read` |
| AI Tools | `/ai-assistant` | `ai_draft.request`, `ai_draft.read` |
| Medication Reference | `/medications` | `medications.read`, `medications.search` |

Doctor-only users can receive the doctor minimalistic mobile bottom navigation when interface mode is `MINIMALISTIC`.

## Owner/Admin menu contract

Owner/Admin users receive the broad administration shell and the following registered areas:

### Clinic

- Reception
- Queue
- Calendar
- Doctor Waiting

### Patients

- Patient Files
- New Patient
- Case Library
- Smart Clinical Search
- External Intake Inbox

### Operations

- Encounters
- Prescriptions
- Investigations
- Ultrasound
- Billing
- Reports
- Documents
- Tasks

### Knowledge

- Guidelines
- Protocol Atlas
- Pharmacology / Medication Reference
- AI Tools

### Administration

- Users & Roles
- Services
- Investigation Catalog
- Medication Data
- Clinic Settings
- Security
- Appearance
- Audit
- Admin Control Center

## Accountant contract

The registry explicitly grants Billing visibility to Owner, Admin, and Accountant identities with one or more of:

- `billing.read`
- `billing.manage`
- `billing.report`

The dashboard source also recognizes `Accountant` as a finance-focused role and limits its quick actions to Billing and Patients. A complete accountant route matrix still requires backend guard inspection.

## Nurse contract

A dedicated nurse route registry is not confirmed in the current navigation registry. The Golden Master must therefore avoid inventing nurse navigation. Nurse permissions and any queue/clinical support access must be derived from backend role seeds, controller guards, and rendered runtime behavior before the nurse shell is copied.

Status: `PARTIAL — backend and runtime verification required`.

## Shared top-bar contract

For authenticated users, the shell includes:

- navigation control
- official clinic name
- clinic operations heading/subtitle
- universal search
- account menu
- visible display name and primary role
- branch context
- language switcher
- appearance link for administrators
- logout

The Golden Master must not remove, relocate, or redesign these controls during the identical-copy phase.

## Patient-tab permission gates

| Tab | Permission gate |
|---|---|
| Care Assist | `care_assist.read` or `care_assist.evaluate` |
| AI Drafts | `ai_management.request` or `ai_management.read` |
| Medications | `patient_medications.read` |
| Allergies | `patient_allergies.read` |
| Herbal/Supplements | `medications.search` |
| Medication Safety | `medications.safety_check` |
| Prescription Safety | `medications.safety_check` and/or `prescription.read` |

Other patient tabs may still be protected by route/API permissions even when no tab-level permission is declared in the frontend registry.

## Security interpretation

Frontend visibility is not authorization. The final matrix must reconcile three layers:

1. frontend landing and route helpers
2. navigation and component visibility
3. backend guards, role scopes, branch scopes, and audit requirements

Any mismatch is a security defect and must be recorded before module separation.

## Remaining role tests

- Owner desktop and mobile navigation
- Admin desktop and mobile navigation
- Doctor desktop and mobile navigation
- Receptionist desktop and mobile navigation
- Accountant finance-only behavior
- Nurse behavior and available routes
- direct unauthorized URL access
- cross-branch patient access
- permission removal while session is active
- logout and revoked-session behavior
- Arabic/RTL navigation
- minimalistic versus normal interface mode
