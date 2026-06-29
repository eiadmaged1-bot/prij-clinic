# Known Limitations

- Not production-ready.
- Not a medical device.
- Uses fake/demo data only.
- No external AI.
- No autonomous diagnosis.
- No autonomous prescribing.
- Most protocols are catalog-only.
- Protocol content is short deterministic summary text, not full guideline text.
- The structured protocol editor validates safety shape but does not certify clinical correctness.
- Verified protocols include the original verified examples plus the emergency OB/early pregnancy, AUB/menstrual, contraception, and routine antenatal packs.
- Draft protocol options can be stored for review but are not output in AI Management Snapshot.
- Patient memory stores structured facts only after doctor approval.
- Formula verification is code-level and metadata-level; it is not clinical certification.
- Ultrasound biometry, growth percentile, Doppler, AFI, and SDP formulas are draft/catalog-only.
- No automatic fetal growth restriction diagnosis.
- No fetal image interpretation.
- Audit logs are application-level and not database-tamper-resistant.

# V0.5 Limitations

- This is not an autonomous medical device, diagnostic engine, prescribing engine, or substitute for the doctor.
- Guideline Center import is demo text/local metadata only. Real licensed PDFs and production source packs are not committed.
- `/guidelines/ask` is extractive/mock local search only, not generative RAG.
- Pilot walkthrough automation is script-assisted page/API verification, not full Playwright screenshot/click automation.
- Local route authorization tests intentionally mutate demo records; rerun seed before checking clean protocol counts.
- Local Postgres may already contain migrations from earlier worktrees; current migration deploy reported no pending migrations on the shared dev database.
- Staging smoke was not run in this local integration pass because staging environment variables were not intentionally configured.
