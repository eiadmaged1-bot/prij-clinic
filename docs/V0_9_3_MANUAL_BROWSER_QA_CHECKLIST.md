# v0.9.3 Manual Browser QA Checklist

Use fake/demo data only. Do not create a tag from this checklist alone.

## Login

- [ ] Open `/login`.
- [ ] Confirm demo/local-only wording is visible.
- [ ] Sign in with seeded demo credentials.
- [ ] Confirm invalid login is rejected without exposing stack traces or raw errors.

## Dashboard

- [ ] Open `/dashboard`.
- [ ] Confirm high-level clinic workflow cards load.
- [ ] Confirm no code-like labels, stack traces, JSON, or debug text are visible.
- [ ] Confirm no production-ready medical claim is shown.

## Patients

- [ ] Open `/patients`.
- [ ] Confirm patient list/search UI loads.
- [ ] Confirm only demo/fake patients are used.
- [ ] Confirm navigation to an existing patient works.

## New Patient Creation

- [ ] Open `/patients/new`.
- [ ] Create a clearly fake/demo patient.
- [ ] Confirm save opens the patient workspace.
- [ ] Confirm validation messages are user-facing, not developer-facing.
- [ ] Confirm no real patient data is entered.

## Patient Workspace

- [ ] Open `/patients/:id`.
- [ ] Confirm patient header and tabs fit on desktop.
- [ ] Confirm clinical, finance, documents, medications, and workflow sections load according to role.
- [ ] Confirm record changes remain framed as local/demo and audit-sensitive.
- [ ] Confirm no AI output is final or doctor-replacing.

## Calendar

- [ ] Open `/calendar`.
- [ ] Confirm appointments display without layout overlap.
- [ ] Confirm appointment controls are clear and role-appropriate.
- [ ] Confirm no raw API/debug text appears.

## Queue

- [ ] Open `/queue`.
- [ ] Confirm reception-to-doctor queue workflow is visible.
- [ ] Confirm status labels are operational, not clinical conclusions.
- [ ] Confirm queue controls are role-appropriate.

## Doctor Workspace

- [ ] Open `/doctor`.
- [ ] Open `/doctor/visit`.
- [ ] Confirm doctor workflow is usable without hidden required instructions.
- [ ] Confirm draft clinical areas do not claim autonomous diagnosis or prescribing.
- [ ] Confirm prescriptions remain doctor-authored/doctor-reviewed.

## Billing/Finance

- [ ] Open `/billing`.
- [ ] Open `/finance`.
- [ ] Confirm invoices/payments are manual demo workflows.
- [ ] Confirm no real payment gateway, card capture, checkout, or payment processor language appears.
- [ ] Confirm accountant/owner visibility is correct.

## Orders/Investigations

- [ ] Open `/orders`.
- [ ] Open `/investigations`.
- [ ] Confirm order and investigation workflows load.
- [ ] Confirm no external lab/radiology integration claim appears.
- [ ] Confirm results/report language remains demo/local and review-oriented.

## Medications

- [ ] Open `/medications`.
- [ ] Open `/medications/search`.
- [ ] Open `/medications/safety` only as an authorized role.
- [ ] Confirm medication pages do not show patient dosing instructions derived from market data.
- [ ] Confirm no checkout, stock, cart, ecommerce, or pharmacy-ordering language appears.
- [ ] Confirm safety output is support-only and doctor-reviewed.

## Drug Market

- [ ] Open `/drug-market`.
- [ ] Open `/drug-market/search`.
- [ ] Open admin drug-market pages only as owner/admin.
- [ ] Confirm market strength/form/pack fields are presented as market/reference metadata only.
- [ ] Confirm no market strength/form is shown as patient dosing.
- [ ] Confirm no retail scraping, checkout, stock, or real payment flow appears.

## Admin/Owner Controls

- [ ] Open `/admin` as owner/admin.
- [ ] Open `/admin/accounts`.
- [ ] Open `/owner-control`.
- [ ] Confirm account, RBAC, appearance, audit, and service controls are owner/admin scoped.
- [ ] Confirm sensitive changes require appropriate role and reason where expected.

## Role Visibility

- [ ] Sign in as Owner/Admin and confirm full authorized navigation.
- [ ] Sign in as Doctor and confirm admin/owner-only pages are hidden/denied.
- [ ] Sign in as Nurse and confirm privileged admin pages are hidden/denied.
- [ ] Sign in as Receptionist and confirm clinical/admin pages are hidden/denied.
- [ ] Sign in as Accountant and confirm clinical/admin pages are hidden/denied.

## Mobile/RDP Usability

- [ ] Test narrow/mobile width.
- [ ] Test RDP-sized desktop window.
- [ ] Confirm navigation remains reachable.
- [ ] Confirm buttons and tabs do not overlap.
- [ ] Confirm long labels wrap cleanly without clipping.

## No Code-Like UI Text

- [ ] Confirm no stack trace text is visible.
- [ ] Confirm no raw JSON is visible.
- [ ] Confirm no unresolved TODO/FIXME/dev labels are visible.
- [ ] Confirm no React/Next/Nest/internal route error text is visible.

## No Medication Dosing/Checkout/Stock Language

- [ ] Confirm no market data is framed as patient dosage.
- [ ] Confirm no checkout/cart/order-now flow exists.
- [ ] Confirm no stock/inventory promise is visible.
- [ ] Confirm no autonomous prescribing language exists.
