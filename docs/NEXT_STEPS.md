# Next Steps

Medication data next steps:
- Improve Oman PDF parsing so strength/form/generic fields can be extracted with defensible confidence, then run a small Oman verification batch.
- Continue Bahrain manual review beyond the first 100 verified rows.
- Recover Qatar/Kuwait/SFDA only through official public files or owner-provided official uploads.
- Keep Egypt limited to official file upload and targeted lookup.
- Add UAE/Saudi/Egypt official file intake when owner-provided files are available.

Engineering next steps:
- Expand review queue UI with import-run selector backed by actual import run list.
- Add richer protected admin drawer for raw official fields without exposing raw JSON in normal UI.
- Add API-level integration tests for batch verification once a stable local auth test harness is available.
