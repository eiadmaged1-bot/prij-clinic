# Part H Architecture Inventory

## Patient API Ownership

The patient controller remains the route owner and contains no Prisma access. Domain behavior has a single service owner:

| Responsibility | Owner |
| --- | --- |
| Search, exact MRN, normalized phone, English/Arabic prefix, duplicate candidates | `PatientSearchService` |
| Patient lookup and workspace summary | `PatientLookupService` |
| Registration and duplicate-prevention transaction | `PatientRegistrationService` |
| Timeline aggregation, filtering, stable cursor | `PatientTimelineService` |
| Remaining patient lifecycle operations | `PatientsService` |

`PatientsModule` compiles in a real Nest application context. Routes and response envelopes used by existing callers remain compatible. Branch and permission scope are enforced server-side. Concurrent matching registration requests do not create duplicate patients.

## Patient Workspace Measurements

Measurements use physical source lines:

| File | Before recovery | Final |
| --- | ---: | ---: |
| `apps/web/app/patients/[id]/page.tsx` | 404 | 431 |
| `apps/web/app/patients/[id]/patient-components.tsx` | 2,819 | 1,312 |

The route page now orchestrates session/workspace state and navigation. Extracted domain owners are:

- `panel-components.tsx` — 742 lines
- `pregnancy-components.tsx` — 498 lines
- `visit-flow-components.tsx` — 272 lines
- `workspace-module-renderer.tsx` — 89 lines
- `timeline-components.tsx` — 87 lines
- `patient-workspace-registry.ts` — 41 lines

The largest remaining patient workspace file is `patient-components.tsx` at 1,312 lines; no replacement 3,000-line monolith remains. The authoritative registry defines 16 unique modules covering summary, visit, prescriptions, investigations, women’s health, documents, billing, More, timeline, consents, infertility, ultrasound, reports, internal notes, review hints, and admin history.

Heavy modules cross a dynamic-import boundary and do not fetch until active. Module selection uses `?module=`, responds to browser back/forward, supports reload/deep links, and accepts the legacy `?tab=` mapping. Minimalistic keys remain Summary, Visit, Rx, Requests, and More. Receptionists cannot resolve clinical-only modules or trigger their data requests.

## Dependency and Performance Verification

- Nest application context compiled with 296 sources and one Prisma provider.
- Only the intended foundational Auth, ClinicTime, and Idempotency modules are global.
- No patient-domain circular dependency or unresolved workspace import was detected.
- Two unchanged legacy cycles remain: `audit`/`auth` and `auth`/`users`.
- Initial patient workspace after session bootstrap made one application-data request; visible module switch made one; timeline deep link made two.
- Receptionist workspace made one application-data request and no clinical request.
- Final patient route build output: 32.4 kB route size and 164 kB First Load JS (103 kB shared).
- Build-manifest aggregate for the patient initial route was 355,125 raw bytes across five files. Heavy lazy chunks measured 23,119, 38,559, and 15,831 bytes and were absent from the initial route chunk list.

Automated source and browser tests preserve bilingual labels and RTL contracts. Visual Arabic/RTL and viewport verification remains pending Manual QA.
