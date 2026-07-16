# Next Steps

## After v1.5.0

1. Open a stored authoritative PDF and verify canvas, selectable text, highlights, thumbnails, range requests, print, and Arabic/mobile layout.
2. Stage a non-PHI Arabic XLSX fixture through the review center; verify reload persistence and zero clinical side effects.
3. Run clinical integration suites only with a distinct `TEST_DATABASE_URL`.
4. Have the Owner review Data Hygiene candidates; do not auto-classify them.
5. Obtain approved medication identity/classification sources before expanding counts, and approved clinical sources before publishing any clinical profile section.
6. Complete device-width, ngrok, signed ultrasound report, and Arabic print QA.

1. Complete and record the final build, security, clinical, RBAC, visual, and persistence test matrix.
2. Complete Doctor, Receptionist, and Owner desktop QA at 1366×768, 1440×900, 1920×1080, and 2560×1440.
3. Validate the existing single web tunnel at `/api/backend/...`, including a signed synthetic external-intake dry run. Never expose port 3001.
4. Obtain clinic approval for exact A5 background artwork and field coordinates, then configure the existing safe-area constants without stretching the asset.
5. Review and approve medication sources before any imported row can be treated as a verified reference. `needs_review` is not a clinical-safety approval.
6. Review the exact Google Form contract with the clinic. Only after approval, implement Gemini/Apps Script sender code using Script Properties, test with synthetic data, and then separately approve trigger activation.

Do not activate a Google Form trigger before contract approval. Do not store the HMAC secret in sheet cells. Do not use real patient information during QA or tunnel testing.
