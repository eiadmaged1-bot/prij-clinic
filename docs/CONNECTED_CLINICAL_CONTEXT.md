# Connected clinical context

## v1.4.7 narrow deterministic foundation

Care Assist evaluates existing structured records only. It uses no external AI and creates no diagnosis, order, prescription, dose, or final clinical decision.

Supported combinations:

- active pregnancy + hypertension tag → pathway review and missing BP, proteinuria, platelets, renal, liver and fetal-status prompts;
- PCOS tag + infertility/fertility context → PCOS infertility pathway, metabolic investigation and related medication-profile links;
- active penicillin/amoxicillin allergy → reaction/severity completeness, antibiotic protocol and alternative-medication review;
- renal-impairment tag + active medication → renal guidance, missing/stale renal-result flag, medication profiles and approved-calculator destination.

Every finding stores why it appeared, facts used, missing information, related pathway, medicines, investigations, actions, and local rule version. Actions open review/draft destinations. Destination modules still require doctor confirmation and normal audited saves; nothing is applied automatically.

Doctor actions include Review, Open pathway, Add selected investigations, Open medication profile, Add medication to prescription draft when an encounter exists, Create follow-up, Dismiss, Not applicable, and Snooze. Saved decisions are audited and projected into the unified patient timeline. High/critical dismissal requires a reason.

Current limitation: pathway links use authoritative library search rather than a pinned approved guideline ID/version when none is recorded. Context links do not claim clinical completeness.
