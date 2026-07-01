# Premium Clinic OS Visible Experience

Sprint: v0.9 Premium Clinic OS Visible Experience Sprint

This sprint makes the existing clinic infrastructure visible in the browser without adding medication importers, payment gateways, external AI calls, diagnostic automation, or real patient data.

## Visible Improvements

- Premium shell: sidebar groups for clinic flow, clinical work, reference, finance, owner, and later modules.
- Login: polished local owner demo login with Local Demo warning and no real secret exposure.
- Dashboard: role-aware home for owner/admin, doctor, reception, and accountant workflows.
- Patient creation: full-name-first form, phone, DOB or age note, sex, optional address, national ID note, referral source, notes, validation, and redirect to patient file.
- Patient workspace: central patient file header, focused tabs, quick actions for encounter, appointment, order, and invoice.
- Reception flow: appointment desk, calendar, queue board, and visible handoff language.
- Doctor flow: waiting queue, guided visit, prescriptions, orders, OB/GYN templates, and medication reference access.
- Owner Control Center: settings, appearance, services/prices, users/roles, audit, backup/export status, medication data operations, and safe force-action messaging.
- Finance: manual invoices, payments, daily closing, service catalog use, patient statement, and finance reports remain visible without a real gateway.
- Orders: visible lab/radiology/service order skeleton at `/orders`.
- Consents: visible consent/legal document skeleton with draft/signed/voided language and print/signature placeholders.
- Medication reference: 8,269 official rows, 1,200 verified rows, 7,069 review remaining, Bahrain and Oman availability, simplified trust badges, and non-technical updated/source-tracked wording.

## V0.9.2 Prij Heritage Update

- Prij Heritage is registered as the default branch theme.
- Theme tokens use dark ink, warm paper, teal actions, terracotta accents, white card surfaces, and warm ink-tinted shadows.
- The app shell uses patient search, grouped navigation, and role-aware Owner/Admin visibility.
- Medication and drug-market screens hide registration, source price, import run, parser confidence, raw official row fields, and row preview labels from normal visible UI.

## Safety Boundaries

- Not production-ready.
- No real patient data.
- No real payment gateway.
- No external AI calls.
- No autonomous AI diagnosis, plan finalization, or prescribing.
- Medication data is reference metadata only.
- Strength, form, and pack are never patient use instructions.
- Signed clinical records and audit logs remain protected by existing backend rules.
