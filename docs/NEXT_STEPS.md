# Next Steps

1. Complete and record the final build, security, clinical, RBAC, visual, and persistence test matrix.
2. Complete Doctor, Receptionist, and Owner desktop QA at 1366×768, 1440×900, 1920×1080, and 2560×1440.
3. Validate the existing single web tunnel at `/api/backend/...`, including a signed synthetic external-intake dry run. Never expose port 3001.
4. Obtain clinic approval for exact A5 background artwork and field coordinates, then configure the existing safe-area constants without stretching the asset.
5. Review and approve medication sources before any imported row can be treated as a verified reference. `needs_review` is not a clinical-safety approval.
6. Review the exact Google Form contract with the clinic. Only after approval, implement Gemini/Apps Script sender code using Script Properties, test with synthetic data, and then separately approve trigger activation.

Do not activate a Google Form trigger before contract approval. Do not store the HMAC secret in sheet cells. Do not use real patient information during QA or tunnel testing.
