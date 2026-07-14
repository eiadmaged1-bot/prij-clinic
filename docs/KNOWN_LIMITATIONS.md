# Known Limitations

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
