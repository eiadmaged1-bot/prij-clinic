# Clinical Protocol Verification

Only Owner/Admin can change protocol status.

Allowed status transitions:

- `catalog_only` to `draft`
- `draft` to `verified`
- `verified` to `retired`

Verification requires a reason and source name. Retiring a protocol also requires a reason.

Every status/source change is audit logged as `protocol_status_changed`.

Content editing is deferred until a safe structured editor exists. For now, content should be updated through reviewed code/seed changes.
