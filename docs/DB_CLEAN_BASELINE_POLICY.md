# Clean Local Database Baseline Policy

Cleanup is allowed only for local, dev, development, test, or CI environments.

Apply mode must be explicit. Dry-run is the default. Production, staging, prod-like environment names, and prod-like database URLs fail closed.

The cleanup process must not drop the database, reset migrations, delete users, delete roles, delete permissions, delete owner/admin accounts, delete branches, delete audit logs, delete official medication rows, delete guideline/protocol data, or delete reference catalogs.

Allowed deletion scope is operational patient-linked local data: patients and their linked appointments, queue tickets, encounters, prescriptions, investigation orders/results, reports, billing/payment rows, patient documents, tasks, referrals, consent records, pregnancy/gynecology workflow rows, patient medications/allergies, calculations, and AI draft/snapshot rows.

Generated reports are written to `storage/local-db-reports/` and must not be committed.

Audit logs are preserved by default. An archive mode would need to be implemented separately and remain disabled by default.
