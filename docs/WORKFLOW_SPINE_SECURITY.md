# Workflow Spine Security

V0.7 keeps server-side RBAC as the authorization boundary.

## Permissions

New permission groups cover investigation results, routing, patient documents, consent templates, consent demo signing/review, referrals, patient tasks, and internal notes.

## Audit

Sensitive actions are audited:

- result create/update/review/void/critical acknowledgement
- document create/update/review/archive/void
- consent template create/update
- consent demo sign/review
- referral create/update/close
- task create/update/complete/cancel
- internal note create/update/archive

Audit metadata stores IDs/statuses and avoids raw file contents, secrets, tokens, passwords, and excessive clinical text.

## Privacy

Documents remain metadata-only. Internal notes are role-filtered. Clinical result detail is denied to unauthorized roles. UI hiding is not treated as security.
