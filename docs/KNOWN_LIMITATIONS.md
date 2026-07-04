# Known Limitations

- Clinical requests reuse existing investigation request tables internally for migration safety.
- Prescription builder patient attachment now uses the shared searchable PatientPicker; deeper browser E2E coverage is still needed.
- Appointment drawer patient selection still needs a full workflow pass if long-list selection is added there.
- Some patient action drawer fields still use text placeholders for doctor/room until provider and room setup is expanded.
- Local/demo account creation allows short passwords and short login IDs only outside production.
- Blank account email is stored with an internal non-login `@accounts.prij.local` compatibility value because the current User schema still requires a unique email.
- Official medicine source verification does not mean clinical safety verification.
- Live search ranking is local UI ordering over existing API results; it does not add clinical recommendations.
- Follow-up hints are read-only in this sprint.
- Manual QA is still required for role-by-role browser behavior.
- No external AI, WhatsApp, DICOM/PACS, payment gateway, pharmacy inventory, or automatic clinical decisioning is included.
