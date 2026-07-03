# Prij Coding Rules Control Sheet

This sheet is the numbered rule reference for Prij Clinic coding prompts. Future requests can cite rules by number, for example `A8`, `B10`, or `C17`.

## A. Standing Prij Coding Instructions

A1. Build Prij as an OB/GYN-first Clinic Management System, not a generic pharmacy, ERP, or rough demo app.

A2. Build order: stable branch, clean DB, reference catalogs, history sheet, Care Assist, doctor visit flow, medication safety review, admin/source review, then later AI/automation.

A3. GitHub is source of truth. Every completed sprint must commit and push to GitHub after tests pass.

A4. Local path: `C:\Newfolder\prij-clinic`.

A5. Codex command: `codex --sandbox danger-full-access --ask-for-approval never`.

A6. Fast mode: do not run the full test suite after every small edit. Run targeted checks first, then full important checks at the end.

A7. Commit after stable checkpoints.

A8. No fake clinical data: no fake patients, encounters, prescriptions, investigation results, clinical claims, or fake reviewed medication safety data.

A9. Real patient data may be supported only when intentionally added by the user. Code must not seed or invent real patient data. Real data must be protected with RBAC, audit logs, encryption-ready storage, backups, consent, and PHI/PII controls. Tests and seeds must stay synthetic or empty.

A10. AI and Care Assist may help with summaries, missing fields, safety flags, search, later OCR, and reminders. They must not silently replace the doctor.

A11. Any AI-like clinical output must be shown as a note, hint, or draft only. It cannot write final records, prescribe, sign, or apply changes unless the doctor explicitly approves.

A12. Always protect RBAC, authentication, CORS, audit logs, consent, PHI/PII protection, prompt-injection protection, backups, and access control.

A13. Normal UI must not show code-like text such as raw JSON, endpoint paths, Prisma/schema words, stack traces, or developer labels.

A14. Medication, investigation, operation, and history catalogs are for documentation, search, and doctor review.

A15. Move fast, but never by weakening safety, deleting migrations, resetting DB, committing secrets, or faking tests.

## B. Current Sprint Implementation Scope

B1. Connect patient file, history sheet, Care Assist, encounter, prescription, investigations, follow-up, and print packet into one doctor visit flow.

B2. Add a clear Start Visit action inside the patient workspace.

B3. Add visit workflow steps: History, Care Assist, Encounter, Prescription, Investigations, Follow-up, Print Packet.

B4. Use the v0.12.2 Patient History Sheet inside doctor visit flow.

B5. Allow the doctor to run missing-field checks during the visit.

B6. Show missing chief complaint, HPI, menstrual history, OB history, LMP, pregnancy/lactation status, medication history, allergy history, investigations, follow-up, and similar fields.

B7. Allow doctor to Accept, Dismiss, Snooze, or Resolve Care Assist findings.

B8. High or critical review findings require a reason if dismissed or overridden.

B9. Use medication search with generic name always clearly visible.

B10. Show a medication safety side terminal on medication search hover, focus, selection, and in the prescription screen. The panel shows generic name, optional trade/brand/search match, class/family, legacy pregnancy category badge, lactation profile badge, source name, review status, confidence level, last checked/updated, and warnings for missing source or required review. Do not claim a profile is current today unless a source-refresh job actually ran today and persisted that date.

B11. Keep pregnancy/lactation profiles review-gated. If data is not reviewed or sourced, show Review required.

B12. Use investigation catalog search to add requested investigations to the visit/order.

B13. Add manual follow-up date/task/note entry.

B14. Printable visit packet includes patient summary, history, encounter, generic medication names, optional trade note only if present and enabled, safety flags, requested investigations, and follow-up.

B15. Audit visit start, history update, Care Assist evaluation, Care Assist decision, prescription draft, medication safety note/override, investigation order, follow-up, and packet generation when supported.

B16. Add deeper E2E tests for the full doctor visit flow.

B17. Clinical considerations, medication options, dosing hints, ranking notes, or safety warnings may appear only as doctor-facing notes/hints. They must be labeled Doctor review required, stay in the side panel until explicit insertion, never write final records by themselves, never modify prescription/diagnosis/plan without doctor approval, and be auditable when inserted.

B18. Document doctor visit workflow, Care Assist workflow, medication safety terminal, clinical hint boundaries, print packet, limitations, and next steps.

B19. Push branch `feature/v0.12.4-doctor-visit-flow-care-assist-e2e`.

B20. Do not create a release tag.

B21. OpenAI may be used for coding speed or future doctor-facing draft assistance only if explicitly enabled. Do not add new runtime OpenAI clinical calls for this sprint unless an existing safe disabled/draft-only pattern exists.

## C. Forbidden Actions And Safety Boundaries

C1. Do not finalize or apply a diagnosis automatically. Possible diagnosis or differential text can appear only as a doctor-review note.

C2. Do not prescribe medication automatically. Medication option notes require an explicit doctor action before insertion.

C3. Do not auto-fill dose, frequency, or duration by default. Dose-related text can appear or be inserted only through an explicit doctor-intended template/button and remains draft/manual until approved.

C4. Treatment ranking may appear only as a doctor-facing note with source/reason and Doctor review required.

C5. Pregnancy safety UI may show only legacy category badge A/B/C/D/X/N/Unknown/Review required. Do not display safe in pregnancy wording.

C6. Do not invent pregnancy or lactation safety data.

C7. Pregnancy category E is invalid. If imported, map it to REVIEW_REQUIRED.

C8. Trade-name search may be allowed later from approved/reviewed data, but generic name must always be clearly shown and remain the main prescription identity. Do not seed fake trade names. Prescription print is generic-first.

C9. Do not use pharmacy/sales wording such as cart, checkout, buy, stock, availability, supplier, purchase, sales, or pharmacy inventory in reference modules.

C10. Reference medication, investigation, and operation catalogs must not contain or display prices.

C11. Do not seed fake patients, prescriptions, encounters, results, or invoices.

C12. Code must not seed real patient data; accepting real patients requires intentional user entry and the security workflow.

C13. External AI/OpenAI cannot directly write final clinical records, prescribe, diagnose, sign, bypass approval, or generate unsourced medication safety claims.

C14. Do not add WhatsApp integration in this sprint.

C15. Do not add DICOM/PACS work in this sprint.

C16. Do not change billing/finance unless required only for compile compatibility.

C17. Do not reset/drop the database, delete migrations, or run destructive DB commands.

C18. Never run `docker compose down -v` unless explicitly approved.

C19. Do not commit `.env`, API keys, storage, uploads, logs, backups, local DB files, screenshots, test-results, Playwright reports, PDFs, Excel files, raw imports, or secrets.

C20. Do not weaken RBAC, auth, CORS, audit logs, consent, patient scope checks, metadata stripping, or PHI/PII protection.

C21. Receptionist/accountant must not access clinical decision-support, medication safety, or advanced Care Assist tools.

C22. Normal UI must not expose raw JSON, endpoints, schema names, Prisma, stack traces, or developer text.

C23. Do not hard-delete signed clinical records or audit logs. Use void/archive/correction with a reason when needed.

C24. Never claim tests passed unless they were run and passed.

C25. Do not display up-to-date-today language unless a source refresh actually ran today and persisted last checked/source date. Otherwise show Last checked: unknown or Review required.

## Requesting Changes By Number

Use rule numbers directly in prompts, for example:

- `Apply A6 and run only targeted checks first.`
- `Check B10 in the medication safety terminal.`
- `Verify C5, C6, and C25 before commit.`
