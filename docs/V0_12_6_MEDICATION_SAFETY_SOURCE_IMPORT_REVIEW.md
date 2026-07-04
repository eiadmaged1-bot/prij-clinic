# v0.12.6 Medication Safety Source Import + Review Workflow

v0.12.6 adds an Owner/Admin controlled workflow for importing pregnancy/lactation medication safety source rows from owner-provided CSV, JSON, or structured text files.

Imported rows are never approved automatically. Accepted rows are written as `needs_review`; reviewers must approve, reject, or retire with a reason. Approval also requires source metadata.

Safety boundaries:
- No fake pregnancy or lactation claims.
- No autonomous prescribing, dosing, diagnosis, treatment ranking, or patient instructions.
- No automatic web import, scraping, retail/pharmacy source usage, or external AI runtime calls.
- Category `E` is not valid and maps to `REVIEW_REQUIRED` with a warning.
- Doctor approval remains required before clinical reliance.

Commands:

```powershell
npm run db:v126:import-med-safety
npm run test:v126:med-safety-review
```
