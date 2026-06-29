# Pilot Demo Script

Status: script-assisted automation implemented.

The current automated coverage includes protocol pack validation, AI Management Snapshot examples, Guideline Center access/search/ask tests, shared route authorization coverage, and role-specific pilot walkthrough scripts. The walkthrough scripts fetch browser-facing pages, exercise local API flows with fake/demo data, and confirm receptionist/accountant denial for clinical AI, Protocol Atlas, and Guideline Center access.

Walkthrough commands:

```bash
npm run test:pilot:owner
npm run test:pilot:doctor
npm run test:pilot:receptionist
npm run test:pilot:accountant
npm run test:pilot:clinical
npm run test:pilot:finance
npm run test:pilot:ai
npm run test:pilot:guidelines
npm run test:pilot:denials
npm run test:pilot:demo
```

Recommended local rehearsal:
1. Seed the local demo database.
2. Log in as owner.
3. Open dashboard, demo patient, protocol atlas, AI snapshot tab, and guideline center.
4. Generate verified emergency, AUB, contraception, and antenatal snapshots.
5. Confirm catalog-only protocols return no management advice.
6. Approve or reject a snapshot as a doctor.
7. Confirm receptionist/accountant cannot access AI Management, protocol editor, or guideline content.

Safety checks:
- Every AI snapshot is draft support only.
- Doctor review is required.
- No dose automation, final diagnosis, prescribing, real payment gateway, PHI, or external AI.
