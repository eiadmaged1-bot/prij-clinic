# Manual QA Mobile Checklist

Run on iPhone Safari and Android Chrome using the LAN URL from `docs/MOBILE_LAN_TESTING.md`.

- Confirm no horizontal scroll on 360px-class phone width.
- Login as `eyad` with local demo credentials.
- Open Dashboard and confirm topbar actions stack cleanly.
- Open the mobile menu drawer and navigate to Patients.
- Create a local demo receptionist account from Admin Accounts.
- Log out and log in as the receptionist.
- Confirm receptionist cannot see owner/admin navigation.
- Create a fake demo patient only.
- Open the patient file.
- Scroll patient workspace tabs and confirm active tab is clear.
- Open patient actions and confirm buttons/forms are finger-friendly.
- Open investigations/orders from the patient workspace or Orders page.
- Browse Guidelines and Protocol Atlas.
- Open Admin Drug-Market Import as owner/admin.
- Confirm official medication rows are shown as blocked/0 until official rows exist.
- Confirm medication selection remains blocked honestly when no official rows exist.
- Confirm no tiny unreadable tables.
- Confirm no visible raw JSON, endpoint paths, stack traces, Prisma/JWT/RBAC wording, or code-like UI text.
- Confirm desktop layout still keeps the sidebar and remains usable.
