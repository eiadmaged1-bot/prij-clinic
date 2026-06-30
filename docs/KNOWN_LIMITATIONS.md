# Known Limitations

V0.6 master-unified is a local/private integration branch for calculator/AI mega plus medication intelligence. It is not production-ready and must not be used with real patient data.

- No production clinical governance certification has been completed.
- Calculator formulas, OB dating behavior, protocol packs, guideline content, and medication safety rules require qualified clinical review before real use.
- AI remains local/deterministic or placeholder-only. No external AI calls are approved.
- AI cannot diagnose, prescribe, sign, approve, or change final signed records.
- Medication intelligence is reference and safety-support only. It cannot auto-prescribe or convert market strength/form metadata into dosing instructions.
- Guideline vault encryption requires a non-committed local key and operational backup/restore proof before any sensitive file testing.
- Payment, insurance, e-invoicing, pharmacy availability, inventory, and retail workflows are not production systems.
- Receptionist/accountant access must remain non-clinical and must not include clinical decision-support tools.
- V0.6 shell/theme/demo-data hotfix seed records are intentionally small demo references. They prove UI visibility and route behavior only; they are not clinically complete or production validated.
- Drug Market strength/form fields remain market metadata only. The UI must not present them as patient dosing or self-medication instructions.
- Guideline demo chunks are short local placeholders for citation/search testing. They are not licensed guideline reproductions and are not clinical advice.
