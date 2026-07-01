# Account Role Creation QA

Purpose: prove `eyad` can create local demo staff accounts and Receptionist access remains limited.

Run:

```powershell
npm run accounts:v097:role-ready-check
```

Expected behavior:
- `eyad` exists, is active/protected, has Owner role, and keeps System Owner authority.
- `eyad` can create Doctor, Receptionist, Nurse, and Accountant demo accounts.
- The created Receptionist can login.
- Receptionist can access reception workflow APIs such as patients, appointments, and queue.
- Receptionist is denied admin accounts, roles, drug-market review/automation, guideline admin/query logs, protocol atlas, and AI management routes.
- Account creation is audited and plaintext passwords are not stored.
