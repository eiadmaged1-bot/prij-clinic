# Owner Control Center

Date: 2026-06-28

The Owner Control Center is a local V0.1 demo interface for owner/admin operations. It is not production-ready.

## Current Capabilities

- Local admin login: `eyad` / `eyad`.
- Users and roles overview.
- Permissions overview.
- Service and price catalog.
- Add service, edit price, deactivate/reactivate service.
- Appearance and theme settings.
- System safety status.
- Audit log viewer.
- Safe override endpoints for void/cancel/archive actions where implemented.

## Safety Rules

- Owner/admin only.
- Backend permissions protect admin APIs.
- Admin navigation is hidden from non-admin users, but server-side authorization is the source of truth.
- Service and appearance setting changes are audited.
- Override actions require reason and confirmation.
- Audit logs cannot be deleted from the normal UI.
- Signed clinical records cannot be silently hard-deleted.

## Planned Additions

- Branches and rooms management.
- Feature flag detail controls.
- Demo data reset guarded for local/dev only.
- Role editor with explicit review.
- More complete audit filtering and export policy.
- Production correction/retention policy before real patient use.
