# Part H Architecture Inventory

## Largest API Controllers by Line Count
1. `admin.controller.ts` (~10.5 KB)
2. `patients.controller.ts` (~9.8 KB)
3. `medications.controller.ts` (~9.2 KB)
4. `drug-market.controller.ts` (~7.7 KB)
5. `guidelines.controller.ts` (~6.4 KB)

## Largest API Services by Line Count
1. `patients.service.ts` (~86.5 KB)
2. `guidelines.service.ts` (~44.4 KB)
3. `rbac.service.ts` (~34.2 KB)
4. `billing.service.ts` (~33.9 KB)
5. `drug-market.service.ts` (~26.3 KB)

## Largest Web Pages/Components by Line Count
1. `apps/web/app/patients/[id]/page.tsx` (~180 KB)
2. `apps/web/components/medications/MedicationComponents.tsx` (~38.4 KB)
3. `apps/web/app/mvp-page.tsx` (~34.3 KB)
4. `apps/web/app/admin/page.tsx` (~27.1 KB)
5. `apps/web/app/clinic-operations-page.tsx` (~25.5 KB)

## Modules with More Than One Responsibility
- `PatientsModule`: Handles patient identity, search, workspaces, encounters, duplicate-checks, and timelines.
- `Patients [id] page.tsx`: Handles UI for Summary, Visit, Rx, Requests, Pregnancy, Timeline, Ultrasound, Reports, Documents, Billing, and deep routing within the frontend.

## Duplicated Logic Identified
- **Patient Permission Logic**: Branch-scope and role-based checks are duplicated across multiple domain controllers referencing patients.
- **Branch-Scope Logic**: Frequently repeated in `findMany` queries globally.
- **Action Visibility Logic**: Hardcoded in UI components and inconsistently mapped.
- **Navigation/Workspace-Tab Definitions**: Present in `page.tsx` and duplicated in layouts/mobile menus.
- **Date/Time Logic**: Ad-hoc timestamp comparisons in `queue` and `billing`.
- **Idempotency Handling**: Repeated patterns for caching/locking in high-risk mutation endpoints.

## Performance and Bounded Queries
- **Pages Issuing Excessive Initial Requests**: Patient workspace (`[id]/page.tsx`) aggressively fetches data for all tabs simultaneously.
- **Global List Endpoints without Pagination**: Audit logs, patient search, appointments history, documents, guidelines.
- **Unbounded Queries**: `findMany` usage in `PatientsService`, `BillingService`, and `AuditController` without limits.
- **Missing Search Indexes**: Searching across `medicalRecordNumber`, `phone`, and normalized names lacks optimized composite indices in PostgreSQL.
- **Client-Side PHI Filtering**: Search screens pull full subsets and filter locally instead of leveraging DB-side exact matches.

## Architectural Risks
- **High-Risk Transaction Boundaries**: Patient creation + visit start; check-in + active lock; payment + invoice rollup. Often lack robust `Prisma.$transaction` isolation or outbox patterns.
- **Modules with Weak Loading/Error/Empty States**: Dynamic module switching inside `[id]/page.tsx` uses basic `null` or raw JSON string returns.
- **Circular or Global-Module Dependencies**: Several modules inject `PatientsService` globally due to missing domain splits.
- **Operationally Unsafe Dynamic Imports**: `page.tsx` imports heavy visualization and clinical calculators statically, severely bloating the initial Javascript bundle.
