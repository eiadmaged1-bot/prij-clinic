# Protocol Editor Safety

The structured protocol editor lets Owner/Admin gradually convert catalog-only protocols into verified protocols without editing raw JSON.

## Why Raw JSON Editing Is Blocked

Raw content editing is blocked because free-form JSON can accidentally introduce:

- medication dose automation
- prescribing commands
- definitive diagnosis language
- final management plans without doctor review
- unstructured text that AI snapshot output cannot safely validate

The editor accepts only structured fields and requires an audit reason for each save.

## Structured Fields

- summary
- goals
- management options
- safety checks
- contraindication checks
- red flags
- follow-up considerations
- referral considerations
- limitations

Options are capped at five. Safety checks are capped at eight.

## Validation Rules

The API rejects:

- medication dose patterns such as numeric dose plus unit
- "must prescribe" style wording
- "definitive diagnosis"
- "guaranteed"
- "always"
- "never" unless framed as a safety limitation
- verified management availability on non-verified protocols
- management options on catalog-only protocols
- verified status without source metadata, structured content, and reason

Draft protocols may store proposed options, but AI Management Snapshot does not output them until the protocol is verified.

## Audit Rules

Audited actions:

- protocol source update
- protocol alias update
- structured content update
- request verification
- verify
- retire

Audit metadata stores the CUID protocol ID as `protocolId`; the UUID-only `resourceId` field remains null for protocol records.

## Clinical Boundary

The editor does not create automatic diagnosis, automatic prescribing, medication dosing, final plans, signed encounter changes, or external AI calls.
# V0.5 Safety Continuity

The verified packs use the existing structured protocol editor and audit model. Protocol mutations remain owner/admin-managed, reasoned, and audited. The AI Management layer reads verified structured content only and does not modify signed records automatically.
