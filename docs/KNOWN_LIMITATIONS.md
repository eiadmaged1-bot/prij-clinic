# Known Limitations

- This sprint is not a production-readiness or medical-safety claim. Privacy, restore drills, access-control review, monitoring, deployment, and clinical-governance signoff remain required before real PHI/PII use.
- The preserved development database contains real operational records. Destructive tests must continue to use disposable isolated databases.
- The current environment has no `PRIJ_EXTERNAL_INTAKE_SECRET`; public invalid-signature behavior was verified, but a public signed dry run was correctly skipped. The isolated HMAC integration suite passed with an ephemeral secret.
- Seven high-severity dependency findings remain. Most are development-tooling-only; production-reachable `multer` and `xlsx` require controlled upgrade/replacement work. See `docs/DEPENDENCY_AUDIT.md`.
- `npm run test:v139:clinical-tags-edd-intake` retains one legacy static UI expectation for a permanent patient QR label. Current smart-tag and signed-intake suites pass; the removed UI element was not reintroduced.
- Expanded security emits expected warnings for synthetic fallback fixtures, broadly authenticated routes without meaningful denied-role cases, and the absence of an assigned-doctor patient-scope model.
- Medication content remains demo/reference material unless provenance-backed and reviewed. Missing interaction data never means a combination is safe.
- Medication search, smart tags, investigation favorites, Care Assist, and AI drafts are assistive only; they do not diagnose, prescribe, rank treatment, select doses, or write final records autonomously.
- A5 printing is functional, but no final clinic-approved background/template artwork is present. Browser print headers/footers remain operator-controlled.
- Google Form intake never auto-merges. Authorized staff must review pending data conservatively before creating or matching a patient.
- Public ngrok tunnels are temporary QA tools only. Use one tunnel to loopback web port 3000, never expose API port 3001, and never use real patient data through a tunnel.
