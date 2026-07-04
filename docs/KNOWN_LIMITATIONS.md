# Known Limitations

- Clinical requests reuse existing investigation request tables internally for migration safety.
- Prescription builder patient attachment currently accepts patient ID; a picker should be added.
- Follow-up hints are read-only in this sprint.
- Manual QA and browser E2E are still required for role-by-role workflow behavior.
- Local API-backed tests require PostgreSQL, seeded demo data, and reachable API/web services.
- Staging smoke requires `APP_ENV=staging`, disabled AI settings, and staging demo passwords from a non-committed environment source.
- No external AI, WhatsApp, DICOM/PACS, payment gateway, pharmacy inventory, or automatic clinical decisioning is included.
