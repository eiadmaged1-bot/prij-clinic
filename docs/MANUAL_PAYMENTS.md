# Manual Payments

v0.15.0 supports manual payment recording only.

Allowed payment methods:

- Cash
- Card
- Transfer
- Other

Optional fields:

- Payment reference
- Internal payment note

The app must not store card numbers, payment secrets, gateway tokens, passwords, or patient secrets in payment notes. Payment reversal/refund style actions must require a reason and audit logging.

No real payment gateway is integrated.
