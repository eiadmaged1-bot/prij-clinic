# Referrals, Tasks, And Internal Notes

## Referrals

Referrals support inbound, outbound, and internal tracking. Clinical summaries are doctor-authored only. There is no external sending integration.

## Patient Tasks

Tasks support review, consent, document, payment, scheduling, referral follow-up, and admin work. Cancellation requires a reason.

## Internal Notes

Internal notes are not patient-facing and are not exposed to a patient portal.

Visibility is enforced server-side:

- `clinical_only`
- `admin_only`
- `finance_only`
- `internal_all`

Receptionist/accountant cannot read clinical-only notes unless explicitly granted. Doctor cannot read finance-only notes unless owner/admin or explicitly granted.
