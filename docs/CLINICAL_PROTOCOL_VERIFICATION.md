# Clinical Protocol Verification

Only Owner/Admin can use the structured protocol editor at `/admin/protocol-atlas`.

Doctors can read the atlas and create management snapshots for valid patient scope. Doctors cannot verify, retire, or edit protocols. Receptionist and accountant roles cannot access clinical protocol content or AI management snapshots.

## Status Workflow

Allowed workflow:

1. `catalog_only` -> `draft`
2. `draft` -> `verified`
3. any active status -> `retired`

Catalog-only and draft protocols do not generate management options. Retired protocols do not generate management options.

## Convert Catalog-Only To Draft

1. Open `/admin/protocol-atlas`.
2. Search for the protocol.
3. Open the structured editor.
4. Enter an audit reason.
5. Use "Move to draft".

Draft status allows Owner/Admin to store proposed structured options, but AI Management Snapshot still hides those options until verification is complete.

## Verify A Protocol

Verification requires:

- audit reason
- source name
- at least one source year, source URL, source version, or explicit source note in the version field
- structured summary
- at least one structured management option
- content passing safety validation

The verify button remains disabled in the UI until the visible requirements are present. The API re-checks the same requirements and rejects invalid verification attempts.

## Source Fields

Required:

- source name

At least one:

- source year
- source URL
- source version or note

Use original summaries only. Do not paste long guideline text or copyrighted guideline passages into protocol content.

## Audit

Every source, alias, structured content, request-verification, verify, and retire action requires a reason and writes an audit event.

Clinical protocol IDs are CUIDs. Because `AuditLog.resourceId` is UUID-only, protocol CUIDs are stored in audit metadata as `protocolId`.
# V0.5 Verification Rules

Verified protocols must have source metadata, structured content, limitations, and doctor-review wording. The validation suite blocks dose-like patterns, final diagnosis language, automatic prescribing language, and false reassurance language.

If a source URL/version is uncertain, the URL remains blank and the limitations state that final clinical governance review is required before production.
