# Pilot Demo Script

Status: partially automated.

The current automated coverage includes protocol pack validation, AI Management Snapshot examples, Guideline Center access/search/ask tests, and shared route authorization coverage. Full browser walkthrough scripts remain a follow-up item.

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
