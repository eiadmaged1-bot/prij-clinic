# AI Management Snapshot

Management snapshots are deterministic local protocol outputs. They are labeled as draft support only and require doctor review.

No external AI provider is called.

## Workflow

1. Doctor enters diagnosis/problem and patient goal/context.
2. App matches a local protocol by code or search.
3. If the protocol is verified, the app shows short structured options to consider.
4. If the protocol is catalog-only, draft, retired, or unknown, the app shows no management options.
5. Doctor approves, edits and approves, rejects, or ignores.
6. Only approved or edited snapshots can save structured patient memory.

## Guardrails

Snapshot output always includes:

- protocol source
- verification status
- safety checks
- limitations
- doctor decision requirement

Fallback wording is explicit: "If no verified protocol is available, this tool cannot provide management options."

Runtime guards cap management options at five and validate verified protocol content before output. Dose-like text, prescribing commands, automatic diagnosis language, and final-plan language are blocked by the protocol content validator.

## Status Behavior

- `verified`: may output validated structured options.
- `catalog_only`: no management options.
- `draft`: no management options.
- `retired`: no management options.
- unknown diagnosis/problem: no management options.

No output is automatically inserted into signed records, prescriptions, investigations, reports, or final plans.

## Audit

Snapshot creation, doctor review, and patient memory save actions are audited. Snapshot IDs are CUIDs, so they are stored in audit metadata rather than the UUID-only `resourceId` field.
# V0.5 Pack-Specific Snapshot Behavior

AI Management Snapshot remains deterministic and local. It does not call external AI, diagnose, prescribe, dose, or create a final treatment plan.

Pack headings:
- Emergency/high risk: Urgent safety snapshot.
- AUB/menstrual: Gynecology management snapshot.
- Contraception: Eligibility and counseling snapshot.
- Antenatal routine: Antenatal care snapshot.
- Other verified protocols: Management snapshot for doctor review.

Only verified protocols generate management support. Catalog-only, draft, retired, and unknown protocols remain blocked. Every output includes source/verification context, limitations, and doctor approval requirements.
