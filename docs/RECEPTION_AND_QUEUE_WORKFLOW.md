# Reception and queue workflow

## v1.4.7 authoritative flow

Reception Home contains `Check in patient`, `New patient`, `Open queue`, and a compact authoritative preview. Check-in is patient selection → visit type (`كشف`, `إعادة`, `استشارة`, `مستعجل`) → add to waiting line. Urgent visit type derives urgent priority; appointments do not block walk-in Check-in.

New-patient queue insertion uses the persisted patient ID and one retained idempotency key. If patient creation succeeds and queue insertion fails, the patient and visit type remain available with `Retry add to waiting line`; retry never creates another patient. “Already queued” is valid only for the same patient, branch and clinic date in `WAITING`, `CALLED`, or `IN_ROOM`. Completed, cancelled, previous-day, other-branch and other-patient tickets do not block.

Canonical states are `NOT_QUEUED`, `WAITING`, `CALLED`, `IN_ROOM`, `COMPLETED`, `CANCELLED`. Doctor start moves a present ticket to `IN_ROOM`; encounter completion completes it. Both operations are audited and shared views refetch. Receptionists can queue/open a file but cannot start an encounter.

Birth year is persisted. When only year is known, the UI displays approximate age rather than an unsupported exact age.
