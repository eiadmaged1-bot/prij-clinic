# v0.15.0 MVP Business Layer on Walkthrough Lock

v0.15.0 builds on the locked v0.14.4 clinic demo walkthrough. The protected route `/clinic-day/walkthrough` remains the reference flow for reception, check-in, doctor waiting, patient profile, doctor visit, prescription draft, investigations, follow-up, and print packet discovery.

This sprint adds the MVP business layer without changing clinical safety boundaries:

- Visit-linked billing context for appointments, queue tickets, and encounters.
- Service selection from the Owner Service Catalog.
- Draft invoice creation from selected clinic services.
- Invoice issue and reason-required void actions.
- Manual payment recording for cash, card, transfer, and other methods.
- Patient statement source and print-friendly billing views.
- Daily clinic reports for appointments, queue, completed visits, invoices, payments, balances, investigations, pending results, and follow-ups.
- Owner, reception, and doctor daily summary cards.
- Clinic settings polish for identity, hours, currency, invoice prefix, and receipt footer concepts.
- Regression coverage for the v0.14.4 walkthrough plus v0.15 business checks.

Billing is clinic operations only. There is no real payment gateway, no insurance/TPA, and no full accounting ledger. No real patient data is seeded or required.

Clinical AI remains assistive and draft-only. The system does not perform automatic diagnosis, automatic prescribing, automatic dosing, or treatment ranking.

Next sprint should focus on Security + Real Patient Data Readiness.
