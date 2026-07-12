# Manual QA Wave 1

## Environment and Startup Commands

For Manual QA Wave 1, ensure you are running the unified backend and the web frontend locally using the development database.
No external AI or production secrets are required.

### 1. Start the API/Backend
Open a terminal and start the backend. This will run the `apps/api` NestJS server using the local test database:

```bash
$env:DATABASE_URL="postgresql://prij_clinic_dev:prij_clinic_dev_password@localhost:5432/prij_clinic_test_parte?schema=public"
npm run dev --prefix apps/api
```

### 2. Start the Frontend Web App
Open a separate terminal and start the frontend Next.js app:

```bash
npm run dev --prefix apps/web
```

Navigate to `http://localhost:3000` to begin QA testing.

---

## QA Checklist Additions: Architecture & Performance Updates

Please verify the following during Manual QA Wave 1, specifically addressing the recent consolidation efforts:

### 1. Service Layer & Dependency Consolidation
- [ ] Verify that searching for patients (e.g., via the top search bar or Patient List) returns results correctly and swiftly. The `PatientSearchService` domain logic was extracted without breaking existing flows.

### 2. React Monolith & Component Extractions
- [ ] Verify the Patient Workspace (`/patients/[id]`) loads without errors.
- [ ] Check that switching tabs (Doctor Visit, Prescriptions, Timeline, etc.) correctly renders the panels without flickering or missing state. The single `page.tsx` was modularized via the "Sidecar pattern" and `WorkspaceModuleRenderer`.

### 3. Action & Policy Registry (RBAC)
- [ ] **Delete Visit Action:** Verify that the "Delete" button inside the "Doctor Visit Flow" is **visible and clickable** ONLY if you are logged in as an `Owner` or have the `encounter.delete` permission.
- [ ] Try to access the "Delete" button with a receptionist or nurse role (who lack `encounter.delete`) and verify the button is disabled or hidden.
- [ ] Test the primary buttons (New Encounter, Prescription, Request Investigation) in the Patient Workspace. They should respect role/permissions and be grayed out/disabled if the user lacks the specific `.create` permission.

### 4. API Contract Consolidation & Bounded Queries
- [ ] **Timeline Performance:** Navigate to a patient with a long history and open the **Timeline** tab. Verify it loads smoothly. The API now enforces a `take: 100` bound per entity table to prevent OOM faults on high-volume endpoints.
- [ ] Confirm no timeline items older than the top 100 recent overall events are loaded in one go.
- [ ] Check the `GET /encounters` (Case Feed) loads successfully.

### 5. Performance, Indexes, and Bundle Budgets
- [ ] **Search by Phone:** Try searching for a patient by phone number. Verify the search is extremely fast (utilizes new composite indexes).
- [ ] **Workspace Loading Limits:** On initial boot of a patient workspace, verify in the Network tab that minimal requests are made (Workspace Summary + Tab Dependencies).
- [ ] **Lazy Loaded Libraries:** Navigate to the Calculators or Protocol Atlas tabs. Verify they render properly as they use dynamic imports to prevent blocking the initial bundle.

### 6. Transaction Boundaries & Idempotency
- [ ] **Payments:** Process a payment. Ensure the transaction is smooth. Behind the scenes, the system now enforces row-level `FOR UPDATE` locking and idempotency tracking to prevent negative balances or double payments during concurrent requests.
- [ ] **Check-in:** Attempt to check in a patient. Verify the queue ticket updates without error.

**IMPORTANT:** Password functionality remains strictly frozen. Do not attempt to test new password policies, resets, or complexity validation changes as none were implemented.
