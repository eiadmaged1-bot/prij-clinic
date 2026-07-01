# Known Limitations

- Oman MOH batch 4 leaves 4,500 Oman rows review-gated, including 71 currently low-confidence/blocked rows.
- Bahrain NHRA batch 4 leaves 2,569 Bahrain rows review-gated.
- Qatar, Kuwait, and Saudi source recovery remains diagnostic-only unless official files/endpoints are safely accessible.
- Egypt bulk import requires owner-provided official files; targeted lookup is one explicit query at a time.
- Product profiles show audit-backed verification status, but no dedicated `verifiedBy`/`verifiedAt` columns exist yet.
- Raw official fields are intentionally not shown in normal UI.
- Restore drill reports and exports are local ignored artifacts and are not committed.
- Local visual/account UI tests can fail with `fetch failed` when the expected local server state is unavailable.
