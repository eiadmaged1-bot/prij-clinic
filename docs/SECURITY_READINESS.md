# Security Readiness

v0.16.0 prepares Prij Clinic for real patient data readiness review. It does not claim full legal, compliance, operational, or production readiness.

Implemented readiness gates:

- API security headers are applied at bootstrap.
- Staging/production environment validation blocks demo mode, local demo file storage, non-HTTPS app URLs, weak JWT expiry format, demo seed flags, demo passwords, and enabled external AI providers.
- Audit metadata redacts credential-like keys and token-like strings.
- Investigation cancel/void actions require reasons.
- Owner/Admin `/admin/security-readiness` dashboard summarizes readiness without raw env values or secrets.
- RBAC, audit governance, backup, PHI/document safety, production, AI safety, and real patient data readiness checks are registered under v0.16 scripts.

Still required before real patient data:

- Legal/privacy/consent review.
- Production backup monitoring, retention, and restore drills.
- Deployment hardening, TLS, database access control, and incident response review.
- Role-by-role browser QA with clinic-approved users.
- Written policy that AI remains doctor-assist and draft-only.
