# Next Steps

Medication data next steps:
- Continue Oman manual review and consider a future verification batch from remaining strict high-confidence rows.
- Continue Bahrain manual review beyond the 600 verified rows.
- Recover Qatar/Kuwait/SFDA only through official public files or owner-provided official uploads.
- Keep Egypt limited to official file upload and targeted lookup.
- Add UAE/Saudi/Egypt official file intake when owner-provided files are available.
- Periodically run `npm run medication:official-data:export`, verify the ignored local export, and run the isolated restore drill.

Engineering next steps:
- Run manual browser QA for `/login`, `/dashboard`, `/patients`, `/patients/new`, a patient file, `/calendar`, `/queue`, `/doctor`, `/billing`, `/admin`, `/orders`, `/medications`, and `/drug-market`.
- Run Prij Heritage manual QA across shell, dashboard, patient file, doctor workflow, reception queue, calendar, finance, medications, drug-market product profiles, and owner/admin medication review.
- Consider backend persistence improvements for theme defaults only if owner appearance requirements outgrow the current lightweight system.
- Add richer appointment and queue status controls once backend status transitions are wired into the visible pages.
- Add duplicate-patient warning logic behind the patient creation form.
- Add service catalog editing as its own owner page if the current Owner Control Center becomes too dense.
- Expand review queue UI with import-run selector backed by actual import run list.
- Add richer protected admin drawer for original official fields without exposing raw technical output in normal UI.
