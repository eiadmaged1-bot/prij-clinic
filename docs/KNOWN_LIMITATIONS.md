# Known Limitations

This MVP foundation is not production-ready for real clinical operations. It is a local development and demo foundation for review, hardening, and fake-data workflow validation.

## Safety Boundaries

- Not production-ready.
- Not a medical device.
- Uses fake/demo data only.
- No real patient data, PHI files, real payment data, or real licensed guideline files should be used.
- No external AI calls are allowed in the current foundation.
- No autonomous diagnosis, prescribing, signing, report interpretation, or final-record update is implemented.
- AI management snapshots are deterministic/local drafts for doctor review only.
- Protocol content is a short structured protocol summary and workflow aid, not full guideline text or clinical certification.
- The structured protocol editor validates safety shape and blocks unsafe wording patterns, but it does not certify clinical correctness.
- Patient memory stores structured facts only after doctor approval.
- Audit logs are application-level and not database-tamper-resistant.

## Protocol Atlas Limitations

- Most protocols remain catalog-only and do not generate management options.
- Only explicitly verified protocols can generate local deterministic AI Management Snapshot options.
- Draft, retired, unknown, and catalog-only protocols generate no management advice.
- Protocol editor workflows are Owner/Admin-only but still require clinical governance before real use.
- Protocol verification is an internal demo status, not formal medical guideline approval.
- Protocol routes and UI must remain protected by server-side RBAC; UI navigation is not an authorization boundary.

## Guideline Center Limitations

- PDF extraction is basic and may lose tables, page numbers, and formatting.
- Local ranking is keyword overlap, not semantic search.
- `embeddingJson` is reserved for future use.
- No pgvector extension is installed.
- No local LLM or external AI provider is called.
- No automatic update replacement is implemented.
- Private file storage is local. New uploads are encrypted only when `GUIDELINE_VAULT_ENCRYPTION_KEY` is configured.
- Local/demo fallback storage without an encryption key is not acceptable for real licensed files.
- Key rotation, malware scanning, encrypted backup/restore proof, retention policy, and production object storage are not implemented.
- Source registry entries are metadata only, not imported documents.

## Clinical Workflow Limitations

- OB/GYN and general gynecology workflows are recording and workflow foundations, not automated clinical decision support.
- No automatic FGR diagnosis, fetal risk scoring, fake percentile engine, validated growth chart engine, DICOM/PACS workflow, PHI imaging upload, or fetal-image AI is implemented.
- General gynecology templates do not diagnose abnormal bleeding, pelvic pain, PCOS, fibroids, ovarian cysts, or contraception eligibility.
- General gynecology templates do not recommend treatment plans, contraception methods, investigations, medications, or follow-up intervals.
- Consent records exist as a foundation, but production legal text, signature capture, consent override workflow, and full server-side consent enforcement are not implemented.
- Signed encounter correction/versioning is not implemented.
- Browser print styles are intended for demo review and are not legal medical stationery, prescription paper, or production report output.

## Finance Limitations

- Invoice/payment flows are MVP pilot workflows only.
- Service catalog and price editing support active service selection, cost placeholders, and doctor share placeholders, but they are not a production pricing governance system.
- Refunds, invoice voids, and discounts are permission-controlled and audited, but dual approval is not implemented.
- Daily closing, patient statements, and owner finance reports are operational summaries, not a full accounting ledger.
- Payment records must remain metadata-only and must not store card numbers, CVV, payment tokens, or gateway secrets.
- Payment gateway integrations, insurance/TPA, inventory, accounting ledger, tax, e-invoicing, and real gateway reconciliation are not implemented.

## Security And Deployment Limitations

- Staging deployment files are examples and still need a real staging host, DNS/TLS setup, and secret provisioning.
- Production patient use remains blocked until legal/security/privacy launch gates pass.
- Production staff provisioning is not implemented; production seed intentionally does not create demo users.
- MFA, password reset, session revocation, device/session inventory, and full throttling policy are not implemented.
- Branch, clinic, patient, and doctor scoping cover representative read paths and referenced-record write paths for implemented MVP modules, but production-grade policy for every future state transition is still incomplete.
- Patient-to-doctor assignment is not modeled, so doctor access is not yet limited to assigned patients outside doctor-owned records.
- No secure report file/object storage is implemented. Current report records store metadata/reference text only.
- No automated production backup job is implemented yet.

## Testing Limitations

- Current verification relies on typecheck, build, Prisma repair/seed, and focused local smoke/security/UX checks.
- Expanded tests use seeded owner access as the positive control. They do not prove every allowed lower-role path for every route and state transition.
- `npm run test:e2e:v01` covers a fake/demo happy path only. It does not prove clinical correctness, legal consent compliance, payment compliance, production security, or medical-device readiness.
- Browser and visual tests are lightweight page sweeps, not full screenshot comparison, accessibility certification, or full browser matrix testing.
# Medication Intelligence Limitations

- Demo market data is intentionally tiny and not a complete registry.
- Safety checks use limited seeded demo logic and are not a commercial interaction database.
- No dosing database is integrated.
- No real pharmacy integration exists.
- Retail metadata connector is disabled by default.
- Egypt, UAE, and Yemen complete market coverage may require official file uploads.
# Current Limitations: Clean Reference Theme Workflow

- Reference import helper scripts are safe placeholders and do not fetch external data.
- Clean seed verifies bootstrap shape but DB execution still depends on local PostgreSQL availability.
- Calculators/Formulas dashboard card is a registry placeholder, not a clinical calculator engine.
- Medication market metadata is not patient dosing or prescribing guidance.
