# Accounts and Permissions

Date: 2026-06-29

This sprint adds stable account management and session identity for the local/private demo. It is not production-ready and must not be used with real patient data.

## Session Behavior

- Login stores the session in the secure API cookie and mirrors the bearer token in browser storage for current demo fetch helpers.
- `/auth/me` is the source of truth for the current user.
- The app shell shows the current display name, login ID or email, role, Dashboard shortcut, Accounts shortcut for Owner/Admin, and Logout.
- Refresh keeps the session until logout or token expiry.
- Invalid or expired sessions are cleared and the user is sent back to `/login` with a friendly message.
- Logout calls `/auth/logout`, clears local browser session state, and returns to `/login`.
- Opening `/login` while already signed in shows the current user plus actions for Dashboard, Accounts for Owner/Admin, or switching account.

## Protected System Owner

The local demo seed protects exactly one System Owner account:

- Login ID: `eyad`
- Display name: `Eyad Admin`
- Role: `Owner`
- Protected badge: `Protected System Owner`
- Reserved permissions: `system_owner.manage`, `developer_owner.manage`

Normal UI/API flows cannot create another `eyad`, grant reserved System Owner permissions to another account, deactivate `eyad`, demote `eyad`, or remove the reserved protected permissions from `eyad`.

## Account Management

Owner/Admin users can open `/admin/accounts` to:

- list accounts
- create staff accounts
- set role and permission preset
- edit account display details
- reset a temporary password
- activate or deactivate non-protected accounts
- set custom permission toggles inside role boundaries

Passwords are hashed by the API. Password hashes are never returned by account APIs.

## Permission Presets

- Minimum: can only do basic work for role.
- Standard: normal daily work.
- Advanced: more control but not system owner.
- Custom: manual toggles inside the selected role boundary.

Custom toggles cannot grant reserved System Owner permissions. Backend validation enforces the same rules as the UI.

## Audit

The API audits account creation, account updates, password resets, activation/deactivation, and permission changes. Sensitive account changes require a reason.

## Production Warning

Demo passwords such as `eyad` and `LocalDev123!` remain local/private demo only. Production seed refuses demo data and production account provisioning still needs separate password policy, MFA, session inventory, revocation, and operational review.
