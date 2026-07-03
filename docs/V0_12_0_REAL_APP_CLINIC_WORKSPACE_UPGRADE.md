# V0.12.0 Real App Clinic Workspace Upgrade

Branch: `leap/v0.12.0-real-app-clinic-workspace-upgrade`

## Scope

v0.12.0 moves the approved v0.11 static clinic UI direction into the real Next.js app under `apps/web`.

Upgraded areas:
- Real app shell navigation groups: Today, Patients, Clinical, Operations, Knowledge, Medication Reference, Admin.
- Reusable clinic/layout primitives under `apps/web/components/clinic` and `apps/web/components/layout`.
- Shared workflow page rendering for queue, calendar, prescriptions, orders, investigations, and other `MvpPage` screens.
- Patient list and registration text cleanup.
- Dashboard medication-reference status moved to honest availability wording instead of hardcoded counts.
- No-fake-UI source guard and real-app workspace Playwright coverage.

## Safety Preserved

- No database or schema changes.
- No CORS weakening.
- No auth/RBAC weakening.
- Admin links remain hidden through the existing session-driven role/permission checks.
- Tailscale/LAN API exact-origin behavior remains unchanged.
- Image EXIF/GPS stripping and metadata-only/local-demo-file upload policy remain unchanged.
- `QueueTicket.queueDate`, `Encounter.branchId`, and encounter voiding behavior are untouched.
- AI remains assistive, draft-only, and doctor-reviewed.
- Prescriptions remain doctor-controlled; no automatic dosing, diagnosis, prescribing, checkout, cart, or stock workflow was added.

## Tests Added

```powershell
npm run test:v120:no-fake-ui
npm run test:v120:workspace
```

## Phone QA

```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev-lan-profile.ps1 -HostIp 100.127.4.46
```

Open `http://100.127.4.46:3000` and verify login, Dashboard, Patients, Patient File, Queue, Prescriptions, Appearance, and no horizontal scroll.

## Known Limitations

- This is a real-app UI/workflow upgrade, not production certification.
- Full phone QA requires the physical device and local firewall/network path.
- Appointment and queue advanced state transitions still depend on existing backend capabilities.
- Medication reference selection remains blocked or manual when official/imported reference data is unavailable.
- Real patient data and production PHI uploads remain forbidden.
