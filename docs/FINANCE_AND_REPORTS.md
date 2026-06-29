# Finance And Reports Deepening

Date: 2026-06-29

This sprint deepens the MVP pilot finance workflow for fake/demo data only. It is not a full accounting system, not an e-invoicing system, and has no real payment gateway.

## Service Catalog

- Owner/Admin manage services from Admin.
- Finance users can view active services for invoice creation.
- Services include code, name, category, price, currency, active status, optional cost placeholder, and optional doctor share placeholder.
- Service create, price edits, activation changes, cost placeholder changes, and doctor share placeholder changes are audited.
- Non-admin users cannot edit service prices.

## Invoice Flow

- Invoices can be created from the finance page or patient file.
- Invoice lines can reference an active catalog service or use a manual demo line.
- Totals are calculated as subtotal minus discount.
- Discounts require `billing.adjust` and a reason.
- Invoice issue, update, discount, and void actions are audited.

## Payment Flow

- Payments are manual records only.
- Supported methods are cash, card manual note, bank transfer, mobile wallet, and other.
- The app must not store card numbers, CVV, payment tokens, gateway secrets, or real payment details.
- Partial payments update invoice status to partially paid and keep the remaining balance.

## Refund And Void Rules

- Invoice void uses a reason-required endpoint and never hard-deletes the invoice.
- Payment refund uses the existing non-active payment status pattern and requires a reason.
- Payment reversal remains available for correction workflows.
- Refunds, reversals, and voids are audited.

## Daily Closing

The daily closing endpoint summarizes:

- cash
- card/manual methods
- total collected
- refunds
- voids
- net total

The finance page shows these totals with a print action and export placeholder.

## Patient Statement

Patient statements include:

- invoices
- payments
- refunds/reversals
- voids
- total paid and balance

The patient file Billing tab also shows a print-friendly statement summary.

## Owner Finance Reports

Current owner finance report sections:

- revenue summary
- payments by method
- unpaid invoices
- discounts
- refunds and voids
- daily closing summary
- service revenue summary
- doctor share placeholder summary

Export is intentionally a placeholder until audited export controls are implemented.

## Permissions

- `clinic_settings.manage`: service catalog create/edit/deactivate.
- `billing.read`: invoice/payment/service read and patient statement.
- `billing.manage`: invoice create/update/issue.
- `payment.manage`: payment recording.
- `billing.adjust`: discount use.
- `billing.void`: invoice void and payment refund/reversal.
- `billing.report`: daily closing and owner finance reports.

Server-side RBAC remains the authority. UI hiding is not an authorization boundary.

## Limitations

- No real payment gateway.
- No full accounting ledger.
- No insurance/TPA.
- No tax engine or e-invoicing.
- No production export workflow.
- No real patient or real payment data.
