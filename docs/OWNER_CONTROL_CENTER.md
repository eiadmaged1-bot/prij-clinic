# Owner Control Center

The Owner Control Center is available from `/admin` for Owner/Admin roles only. The backend also enforces Owner/Admin access for protected owner settings, so restricted staff cannot access it by calling APIs directly.

Sections:
- Clinic profile placeholder
- Branches and rooms placeholder where current models support branches
- Service and price catalog
- Staff/users links through account administration
- Appearance/theme settings
- Medication safety source review link
- Audit log link
- System status
- Feature flags placeholder

Sensitive changes must be audited where the audit pattern supports them. Service price/status changes, appearance default changes, account changes, and safe override actions write audit entries.

Not included:
- Full accounting ledger
- Insurance/TPA workflows
- Real payment gateway
- WhatsApp
- DICOM/PACS
- External AI runtime calls
- Audit log deletion
