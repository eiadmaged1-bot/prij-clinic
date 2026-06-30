# Known Limitations

- Oman MOH rows are not batch verified because current parser confidence is below the high-confidence threshold.
- Qatar, Kuwait, and Saudi source recovery remains diagnostic-only unless official files/endpoints are safely accessible.
- Egypt bulk import requires owner-provided official files; targeted lookup is one explicit query at a time.
- Product profiles show audit-backed verification status, but no dedicated `verifiedBy`/`verifiedAt` columns exist yet.
- Raw official fields are intentionally not shown in normal UI.
- Local visual/account UI tests can fail with `fetch failed` when the expected local server state is unavailable.
