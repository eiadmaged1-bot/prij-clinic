# Known Limitations

## v1.5.0 limitations

- Physical-device, ngrok, RDP-width, signed-report print, Arabic print, and end-user manual QA were not performed in this Codex session.
- PDF.js has automated contract/type coverage. A stored authoritative PDF must still be opened in the running browser before claiming visual rendering success.
- No spreadsheet was staged during this sprint; XLSX/CSV behavior is validated by focused source-contract tests only.
- Drug Atlas remains 63 active identities and 53 families. Seven identities are unlinked (11.1%). The only approved classification source present is WHO Collaborating Centre ATC/DDD Index 2026. Mechanism, PD, PK, renal, hepatic, pregnancy/lactation, and spectrum rows remain empty/source-incomplete.
- The 300–400 generic and 100–140 family targets are blocked by absence of additional approved/licensed source data. No content was fabricated to meet them.
- Candidate detection proposed 563 patient candidates and 4 intake candidates. Actual Owner-reviewed classification actions in this sprint: zero.
- TEST database integration suites remain unavailable until a distinct `TEST_DATABASE_URL` is supplied; they must not run against the clinic database.

## v1.4.9 exact remaining limitations

- Physical Receptionist/Doctor/Owner browser walkthroughs, iPhone/Android portrait/landscape, mobile Safari PDF behavior, rear camera, real printing, LAN, and ngrok QA were not performed.
- No existing inactive/archive record was bulk reactivated or automatically classified. Owner review is still required; name/MRN signals are candidates only.
- Data Hygiene supports audited classification and review export, but hard delete remains intentionally unavailable for referenced or signed clinical history.
- The import CLI supports CSV directly. XLSX is staged through the web intake parser; extending the CLI with the same XLSX adapter remains outstanding.
- Google Sheets requires deployment HTTPS and a server-side integration key. No real Sheet or Apps Script was connected during automated verification.
- Guideline PDF delivery retains the same-origin ranged browser viewer. Physical mobile Safari rendering and complete amendment-authoring UI remain outstanding.
- The Case Library returns bounded rows but does not yet expose a cursor UI beyond current filters.
- Ultrasound has structured context, autosave/review/amendment controls, but complete image attachment, signed export/print, and serial comparison visualization remain partial.
- Protocol completion stores unanswered questions and connections; no unanswered clinical content is generated. Clinical review and approval remain human responsibilities.
- Medication content expansion is identity and family classification only. Uses, mechanism, PK/PD, cautions, interactions, pregnancy/lactation, renal/hepatic, monitoring, dosing, and susceptibility remain unsupported unless separately sourced and reviewed.
- The workspace persists column and size for forward compatibility, but the current patient file activates one module at a time rather than rendering a simultaneous desktop masonry canvas. Missing-information dismissal-with-reason is not yet implemented.
- Appearance covers the seven required presets and scopes; not every legacy administrative list was converted to a paginated drawer/table in this sprint.
- New workspace copy has central English/Arabic parity. Some older operational modules still use page-local bilingual copy; complete centralized-key conversion of every legacy string is not claimed.
- Account 2FA reset manages a safe prepare/confirm state and session revocation. A full authenticator enrollment/challenge subsystem is not present, so it is not claimed as production 2FA.
- Branch/service-specific pricing overrides were not added because the current pricing model is clinic-wide. Required defaults and audited Owner-only edits are implemented.
- This is not production, privacy, penetration-test, legal, or clinical-governance approval.

## v1.4.6 unresolved recovery limits

- The KFS July 2026 antibiotic PDF is absent from the private vault and was not imported or committed.
- Pharmacology evidence, pregnancy/lactation, aliases, antimicrobial spectrum, and Dermatology tables remain empty.
- Autosave restores visit fields; recovery of every basket, active step, and open drawer is not proven.
- Physical mobile/desktop, ngrok, camera, offline reconnect, and print walkthroughs were not performed.
- Credential-dependent concurrency/E2E suites were not run without isolated credentials.

- This sprint is not a production-readiness or medical-safety claim. Privacy, restore drills, monitoring, deployment, penetration testing, and clinical-governance signoff remain required.
- Full manual role QA at every requested desktop/mobile viewport has not yet been rerun after the v1.4.4 changes. Current claims are automated/build verification unless explicitly stated otherwise.
- Some legacy integration scripts assume disposable databases but do not enforce them or self-clean. The final clinical persistence and OB/GYN runs created clearly labeled synthetic test records in the preserved development database. They were not deleted because destructive cleanup was not proven safe; administrators should review/archive them through the application.
- Protected seeded account credentials were unavailable, so credential-dependent security, guidelines, and investigation-result legacy suites are not complete.
- Current-branch ngrok QA has not yet been run. Prior v1.4.3 tunnel results do not prove v1.4.4 behavior.
- Arabic direction and core translation infrastructure work, but multiple legacy and newly reconstructed clinical screens still contain English-only operational copy. Full translation completeness is not claimed.
- Language preference is device/browser persisted, not yet synchronized as a server-side per-user preference.
- Guideline uploads support PDF, TXT, and Markdown. DOCX is not accepted because a safe extractor is not installed. Annotations and version replacement UI remain incomplete.
- Investigation favorite sets expose personal creation in the current UI. Branch/clinic scope enforcement exists in the API, but shared-scope creation controls and restore UI remain incomplete.
- The investigation catalog was not expanded or reviewed as a comprehensive bilingual catalog in this sprint. Existing provenance limits apply; no catalog is claimed to cover every investigation.
- Investigation result endpoints support received/reviewed/cancelled follow-up, but the full requested scheduled/collected/performed/structured-result lifecycle and every cross-patient filter are not complete.
- Smart cohort provenance and operators are implemented. Saved/pinned cohort dashboards, procedure-specific drawers, oncology concern workflows, and automatic source adapters across every requested record family remain incomplete.
- Patient import does not automatically merge or overwrite. It imports only READY rows. Rollback is represented by preserved batch/row links, but an audited archive/rollback action UI is not yet implemented.
- Patient schema currently has no dedicated spouse, address, secondary-phone, external-ID, or registration-date columns; those mapped import values are previewed but are not silently written into unrelated fields.
- CSV parsing supports normal quoted rows but not embedded multiline quoted cells. Windows-1256 requires explicit selection.
- A5 prescription printing has no final clinic-approved background artwork. Browser print headers/footers remain operator-controlled.
- Medication, investigation, guideline, Smart Search, and AI content is assistive and draft/review-oriented. Nothing autonomously diagnoses, prescribes, doses, treats, or finalizes clinical records.
# v1.4.5 limitations

- No pharmacology, Dermatology, guideline summary, or calculator dataset is claimed complete or clinically verified. Normal views expose only approved evidence; seeded generic identities are not clinical recommendations.
- PDF rendering uses the browser viewer with extracted-page fallback; advanced native thumbnail/search behavior depends on browser PDF support.
- Camera scanning requires HTTPS and compatible hardware. LAN HTTP retains manual lookup only.
- Credential-dependent integration suites and physical-device/ngrok QA require configured test accounts and an active tunnel.
- Calculators support approved, reviewed, test-locked handlers only and never prescribe or infer missing inputs.

## v1.4.7 exact remaining limitations

- Guideline version and archived-asset operations are visibly blocked because `GuidelineVersion` does not own an authoritative stored asset. New-version/restore uploads cannot silently replace a document.
- Viewer totals no longer default to 1/1, but true PDF.js-derived page metadata/rendering is not implemented; the retained browser viewer and indexed page metadata remain the available mechanisms.
- The KFS antibiotics PDF is absent. Metadata is corrected to July 2026; no clinic-approved status is claimed without an approval record.
- Pharmacology coverage is incomplete. Ten generics have no deterministic family membership; uses, mechanisms, kinetics, renal/hepatic guidance, adverse effects, interactions, pregnancy/lactation, monitoring, calculators and sources are not claimed where records are missing.
- Dermatology content remains incomplete and was not expanded or clinically verified in v1.4.7.
- Atlas browse lenses use the same preserved dataset; absent structured evidence can produce no results.
- Connected-context links prepare review/draft destinations. They do not automatically insert investigations, medications, prescriptions, or follow-ups.
- Physical camera, mobile Safari PDF, orientation, real printer, authenticated role, current tunnel, backup restore, and credential-dependent QA remain unperformed.

## v1.4.8 exact remaining limitations

- The PDF page count is authoritative for newly parsed PDFs, but the UI uses the maintained browser PDF renderer through the same-origin ranged asset route; a bundled PDF.js canvas renderer was not added. Mobile Safari rendering still requires physical-device QA.
- Existing guidelines without stored `pageCount` use the highest indexed section page as a conservative fallback until re-imported or reparsed.
- Protocol structured editing and verification remain in the existing Owner/Admin editor. A separate Protocol Completion Questionnaire was not completed in this sprint.
- The existing patient Pregnancy/Ultrasound editor supplies recording and review controls; a complete signed amendment history, serial-measurement comparison UI, and physical print/export QA remain incomplete.
- Secure admin password reset and session revocation exist. Self-service Owner password change, explicit force-change flag, 2FA reset, and a dedicated lock/unlock control were not completed.
- The final active Owner is protected from deactivation/demotion. Broader replacement of every legacy admin card screen with paginated tables/drawers was not completed.
- Central English/Arabic dictionaries, navigation, account sheet, new encounter/ultrasound entry screens, RTL, persistence, and mojibake checks are covered. Some legacy operational copy in older affected modules remains page-local bilingual copy rather than the central dictionary.
- Pharmacology content remains incomplete and is not clinically verified: missing mechanisms, kinetics, renal/hepatic guidance, adverse effects, interactions, pregnancy/lactation, monitoring, sources, and unlinked family relationships remain visible as coverage gaps, never as verified facts.
- Physical iPhone/Android orientation, rear-camera, swipe, PDF, print, authenticated role walkthrough, LAN, and ngrok QA were not performed.
- Prisma client generation encountered a Windows query-engine DLL lock twice. Per the sprint repair limit it was not retried again; final repair output determines whether the local lock still affects release verification.
