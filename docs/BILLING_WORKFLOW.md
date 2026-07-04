# Billing Workflow

Billing is linked to clinic operations and patient context. Invoices can reference an appointment, queue ticket, or encounter when available, but billing remains separate from clinical decision-making.

Workflow:

- Select a patient from the patient workspace or Billing page.
- Choose a clinic service from the Owner Service Catalog, or add a manual billing-only service line.
- Create a draft invoice.
- Issue the invoice when it is ready to share.
- Void only with a required reason; no silent hard delete is supported.

Service prices are clinic billing settings only. They must not pollute medication, investigation reference, operation history, or clinical catalog pricing.

No insurance, payment gateway, or full accounting ledger is included in v0.15.0.
