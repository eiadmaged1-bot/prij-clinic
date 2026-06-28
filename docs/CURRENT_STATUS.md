# Current Status

Date: 2026-06-28

Branch: `ui/medicolize-style-owner-portal`

Target tag: `v0.1-medicolize-style-owner-portal`

## Status Summary

The V0.1 pilot foundation is a locally runnable, GitHub-backed, CI-tested demo foundation. It is not production-ready and must not be used with real patient data, real payment data, PHI report files, real AI provider access, or live clinical workflows.

## Implemented Foundation

- Auth: local staff login, JWT cookie/bearer support, account lockout after repeated failures, logout audit.
- RBAC: seeded roles and permissions with server-side permission guards on protected controllers.
- Scope filtering: branch scope for non-owner/non-admin reads and referenced-record writes where supported; doctor scope for doctor-owned records where relevant.
- Audit: append-only audit table and metadata-only audit hooks for implemented create/update/status/sign/review/payment and sensitive read actions.
- MVP modules: patients, appointments, queue, encounters, prescriptions, investigations, reports, pregnancies, OB ultrasound, billing, payments, dashboard.
- Consent records: V0.1 structured consent foundation with audit metadata. Production legal text, signature capture, overrides, and full enforcement remain incomplete.
- AI draft review placeholder: disabled/mock-only draft artifact workflow with doctor-review statuses.
- V0.1 focused clinic UI: login displays demo credentials, patients has a clear patient-file list, new patient creates a real demo file through `POST /patients`, and `/patients/:id` is the focused patient workspace.
- V0.1 Admin Control Center: local admin login `eyad` / `eyad`, users/roles overview, service catalog and price editing, system safety status, audit viewer, and reason-required override endpoints.
- Theme system: Original Premium, Clinic Portal, Incision Portal, Minimal Clean, and Compact Operations appearances.
- Admin Appearance Settings: admin-only appearance page and protected settings API for local demo default theme changes with audit entries.
- V0.1 module pages: home, login, dashboard, admin, patients, new patient, patient file, appointments, calendar, queue, encounters, prescriptions, investigations, reports, pregnancies, OB ultrasound, billing, consents, and AI drafts.
- V0.1 E2E workflow test: `npm run test:e2e:v01` creates fake/demo workflow records and checks representative audit metadata.
- Backup/restore foundation: local-only backup script, guarded restore script, and backup/restore docs.
- Deployment readiness docs: environment strategy, CI env example, deployment requirements, and production blockers documented.
- CI: GitHub Actions runs install, Prisma client generation, typecheck, and build on `push` and `pull_request`.
- Security integration CI: GitHub Actions can run database-backed API security integration tests with PostgreSQL, existing Prisma migrations, demo seed data, and disabled/mock-only AI settings.
- Smoke test: `npm run smoke:test` checks health, DB connectivity, login, anonymous denial, protected API routes, AI disabled/mock metadata, and core web pages.
- Security tests: local scripts cover representative RBAC denial/allow paths, branch scope behavior, audit creation and metadata minimization, and AI disabled/mock safety.
- CI security test: `npm run test:security:ci` covers API health, database health, seeded owner login, anonymous denial, representative protected endpoints, and disabled/mock-only AI draft safety.
- Expanded route security tests: `npm run test:security:expanded` covers the executable route manifest, representative denied-role checks, out-of-branch referenced-record write denial assertions, audit assertions, and AI safety regression.
- Role permission matrix: `docs/ROLE_PERMISSION_MATRIX.md` documents seeded Owner/Admin/Doctor/Nurse/Receptionist/Accountant behavior and lower-role denial expectations.

## Safety State

- Seed data uses demo-only records such as `Demo Patient A` and `Demo Patient B`.
- No real AI API calls or provider SDK usage are implemented.
- AI draft artifacts are marked `disabled_mock` / `no_external_ai`.
- AI draft review cannot update final clinical records.
- OB ultrasound fields do not calculate diagnoses or trigger fetal-image analysis.

## Local Verification

Recommended full local sequence:

```powershell
npm run dev:stop
npm run prisma:repair
npm run prisma:seed
npm run typecheck
npm run build
```

Then start API and web:

```powershell
npm run dev
npm run smoke:test
npm run test:security
```

API-only security integration check:

```powershell
npm run test:security:ci
npm run test:security:expanded
npm run test:admin:control
npm run test:theme:ui
npm run test:e2e:v01
```

Focused UI verification:

```text
Login -> Dashboard -> Patients -> New Patient File -> Save and open patient file -> patient file tabs
```

## UI Safety State

- The app shell shows compact demo/local warnings and AI disabled/mock-only status.
- The login page shows the exact local Demo Owner credentials: `demo.owner@prij.local` / `LocalDev123!`.
- The login page shows the exact local admin credentials: `eyad` / `eyad`.
- Patient file creation redirects to `/patients/:id` after a successful API save.
- Module pages are intentionally focused on the active workflow and no longer repeat broad dashboard/module shortcut content.
- Admin can edit local demo service prices and deactivate/reactivate services from the UI.
- Admin override endpoints require a reason and confirmation, create audit entries, and do not provide hard-delete routes for audit logs or signed clinical records.
- Admin and Appearance navigation is hidden from non-admin users, and backend admin settings routes reject non-admin access.
- Clinic Portal theme provides an owner-focused left-sidebar dashboard with patient search, compact badges, owner cards, and hidden owner tools.
- Incision Portal theme still provides a white app-launcher dashboard with My Apps and All Apps tabs and large workflow tiles.
- Forms and page copy instruct users not to enter real patient, payment, report, credential, or secret data.
- AI draft UI remains disabled/mock-only and doctor-review-only.
- OB ultrasound UI states that physician interpretation is required and does not provide automatic FGR or other diagnoses.

## Commit Safety

Before commit, ensure these are not staged:

- `.env`
- `apps/api/.env`
- Any `*.tsbuildinfo`
- Logs
- Uploads
- Local database files
- Secrets, API keys, tokens, or patient data
