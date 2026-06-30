# V0.7 Clinic Workflow Spine

V0.7 deepens the local/demo clinic workflow around the patient file:

Reception or doctor creates visit context, orders investigations or services, routes work to demo departments/providers, records result metadata, doctor reviews result flags, archives document metadata, records consent templates/demo signatures, tracks referrals, tasks, and internal notes, shows events on the patient timeline, and supports browser print packets.

## Safety Boundary

- Local/demo only.
- Fake/demo records only.
- No real PHI upload or production file storage.
- No OCR, DICOM/PACS, WhatsApp, payment gateway, insurance claim submission, external AI, automatic diagnosis, automatic report interpretation, automatic treatment recommendations, or real e-signature.
- Critical and abnormal result flags are workflow flags only.
- Result interpretation and referral summaries are doctor-authored only.
- AI remains disabled/draft-only and cannot write final records.

## Added Model Areas

- `InvestigationResult`
- `ExternalProvider`
- `ClinicDepartment`
- `PatientDocument`
- `ConsentTemplate`
- `Referral`
- `PatientTask`
- `PatientInternalNote`

Existing `InvestigationOrder`, `InvestigationOrderItem`, and `ConsentRecord` were extended rather than duplicated.

## Verification

New focused runner:

```powershell
npm run test:workflow:spine
```

It checks result metadata, critical acknowledgement, document archive reason, consent demo signature, referrals, tasks, internal note visibility, timeline inclusion, and no automatic diagnosis wording.
