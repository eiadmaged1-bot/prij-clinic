# Known Limitations

- Staff chat uses REST refresh/polling instead of WebSockets.
- Patient-linked staff messages are operational and are not inserted into encounter notes.
- Doctor reassignment after start is not exposed as a normal workflow; future reassignment must require Owner/Admin permission and audit reason.
- Trusted-doctor access currently follows the Doctor role permissions configured for this two-doctor clinic.
- No external AI, WhatsApp, SMS, or automatic clinical decisioning is enabled.
