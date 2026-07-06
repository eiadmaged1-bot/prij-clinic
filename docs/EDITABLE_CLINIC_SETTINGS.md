# Editable Clinic Settings

Clinic Settings is an Owner/Admin form backed by the audited `SystemSetting` store.

Editable sections:
- Clinic identity: name, phone, address.
- Schedule: working hours, default appointment duration.
- Billing defaults: currency, invoice prefix, receipt footer note.
- Appearance: density mode.
- Admin links: audit log, medication safety review, service catalog, appearance.

Controls:
- Edit, Save, and Cancel workflow.
- Owner/Admin permission guard through `clinic_settings.manage`.
- Non-admin roles cannot edit through the API.
- Settings updates create `system_setting.clinic_profile_updated` audit events with a reason.
- Inputs are length-limited, numeric ranges are controlled, currency is selected from allowed values, and raw HTML is not rendered.
