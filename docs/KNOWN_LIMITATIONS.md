# Known Limitations

- This sprint is not a production-readiness or medical-safety claim. Deployment, privacy, backup/restore, access-control, and clinical governance signoff remain required before real PHI/PII use.
- Medication content is incomplete. Current rows are demo/reference fixtures unless a provenance-backed source is imported and reviewed; missing interaction data never means a combination is safe.
- Medication search and Care Assist are reference aids only. They do not diagnose, prescribe, choose treatment, choose a dose, or update final records autonomously.
- A5 print architecture and safe-area configuration are functional, but no final approved clinic background/template asset was found. Exact placement remains a clinic-approval TODO.
- Calendar day/week/month controls are present, but the current data query remains anchored to the selected date; full range aggregation is future work.
- Investigation favorites are doctor-controlled request bundles, not suggested workups or clinical decision support.
- Smart tags are structured history/search metadata, not diagnoses. Search access is scoped and audited.
- Google Form intake never auto-merges. Reviewers still need conservative field-by-field verification before creating or matching a patient.
- Public tunnels are temporary QA tools only. Use synthetic data, tunnel web port 3000 only, and route API calls through `/api/backend/...`.
- Browser print headers/footers such as URL/title are controlled by the print dialog and must be disabled by the operator; application chrome itself is excluded from the print route.
