# Consent And Privacy Foundation

Date: 2026-06-28

This document describes the V0.1 consent/privacy foundation. It is not production legal advice, not production consent text, and not approval to use real patient data.

## Current Implementation

- Consent routes require JWT authentication and RBAC permissions.
- `POST /consents` requires `patient.consent_manage`.
- `GET /consents?patientId=` requires `patient.consent_read`.
- Consent create/read checks patient branch scope before returning or writing records.
- Consent create/read writes audit metadata.
- Audit metadata stores IDs, consent type, status, branch, and counts. It must not store passwords, tokens, real signatures, legal documents, or raw clinical bodies.

## Consent Types And Statuses

The schema supports structured consent status records for V0.1 demo use. The current implementation is a foundation only:

- No production legal text.
- No real signature capture.
- No consent document file upload.
- No legal jurisdiction handling.
- No patient portal consent flow.
- No production override workflow.

## Privacy Rules For V0.1

- Use demo/synthetic records only.
- Do not enter real names, phone numbers, addresses, identifiers, clinical histories, reports, images, or payment details.
- Keep AI disabled/mock-only.
- Do not upload real report files or PHI.
- Use minimum necessary fields in tests and demos.
- Keep logs and audit metadata free of credentials and raw clinical text.

## Enforcement Status

Implemented:

- Auth/RBAC on consent routes.
- Branch-scoped patient reference checks for consent create/read.
- Audit metadata for consent create/read.
- Automated consent/privacy smoke test: `npm run test:consent:privacy`.

Not production-complete:

- Workflow blocking based on treatment/report/AI consent is not fully enforced across every module.
- Consent withdrawal, override, expiry, and renewal policies are not complete.
- Legal text, signature capture, document retention, and jurisdiction-specific review are not implemented.
- Patient-to-doctor assignment is not modeled.

## Production Requirements

Before real patients:

- Legal/privacy review of consent text and workflow.
- Explicit policy for treatment, communication, report storage, AI/data processing, and file sharing consent.
- Withdrawal and override workflow with reason capture and high-severity audit.
- Consent status checks before report upload/download/export and any future AI processing.
- Patient-facing consent capture or scanned consent storage only after secure file storage is implemented.
- Retention and export policy for consent records and related audit logs.
