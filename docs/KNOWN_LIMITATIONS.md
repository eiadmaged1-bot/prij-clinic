# Known Limitations

- Clinical requests reuse existing investigation request tables internally for migration safety.
- Prescription builder patient attachment currently accepts patient ID; a picker should be added.
- Some patient action drawer fields still use text placeholders for doctor/room until provider and room setup is expanded.
- Local/demo account creation allows short passwords and short login IDs only outside production.
- Official medicine source verification does not mean clinical safety verification.
- Live search ranking is local UI ordering over existing API results; it does not add clinical recommendations.
- Follow-up hints are read-only in this sprint.
- Manual QA is still required for role-by-role browser behavior.
- No external AI, WhatsApp, DICOM/PACS, payment gateway, pharmacy inventory, or automatic clinical decisioning is included.
