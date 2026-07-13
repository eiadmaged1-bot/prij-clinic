# Part H Index Rationale

Part H retains only one new index after tracing current Prisma query paths. Indexes are not accepted solely because they appeared in an earlier proposal.

## Retained: `Patient(phone)`

- Endpoint/service: external-intake duplicate matching in `ExternalIntakeService.duplicates`.
- Query: `Patient.findMany` contains an exact `phone` equality branch, combined with optional name/date alternatives, and returns at most 10 candidates.
- Related paths: patient duplicate review and global search also use phone, although their current contains/in-memory matching does not receive a reliable B-tree benefit.
- Ordering: none required for the exact-phone candidate branch.
- Selectivity: normalized full phone values are expected to be substantially more selective than status or branch alone.
- Existing overlap: Patient previously had branch, status, patient type, last/first name, and unique MRN indexes; none begins with phone.
- Write cost: one additional B-tree update per patient insert or phone change.
- Decision: retain. It supports an actual exact lookup and does not overlap an existing leading column.

## Removed: `Appointment(status, startAt)`

- Inspected paths: appointment list, calendar, dashboard counts, patient workspace summary, and patient timeline.
- Actual filters/orderings: calendar and dashboard filter time ranges with branch/doctor scope; patient workspace filters by patient relation and time/status; general list orders by `startAt` without a status predicate.
- Existing overlap: `Appointment(branchId, startAt)`, `Appointment(patientId, startAt)`, and `Appointment(doctorId, startAt)` match the leading scope used by those queries.
- Selectivity: appointment status is low-cardinality and is not the leading predicate in the inspected operational queries.
- Write cost: every appointment status transition would update the proposed index.
- Decision: remove from the Part H migration and Prisma schema because no current query justifies it.

## Not New: `AuditLog(branchId, createdAt)`

- Query paths: recent audit and owner-control views order by `createdAt`; branch-scoped audit reads can filter by branch and recency.
- Existing overlap: migration `20260627154822_foundation_rbac_audit` already creates `AuditLog_branchId_createdAt_idx`, and the current Prisma schema already declares it.
- Decision: retain the existing foundation index but do not recreate it in Part H. A duplicate migration index would add write cost without query benefit.

## Part H Migration Scope

The release schema also declared indexes that earlier migrations had not created. Part H creates them forward-only so a fresh migration chain matches the checked-in schema:

| Index group | Actual access path | Retention reason and write cost |
| --- | --- | --- |
| `PatientDocument.linked*Id` (five indexes) | patient document linkage and referenced-record lookups | Foreign-key-like optional identifiers are selective; cost occurs only when document linkage is created or changed. |
| `PatientInternalNote.createdByUserId`, `noteType`, `pinned` | role-filtered note lists and pinned/type filtering | Supports bounded workspace note filters; note writes are low-frequency relative to reads. |
| `PatientTask.createdByUserId`, `taskType`, `priority` | task ownership/type/priority queues | Supports operational inbox filters; each task insert/status update maintains small B-trees. |
| `Referral.encounterId`, `pregnancyId`, `referredByUserId`, `referralType` | encounter/pregnancy-linked referral lists and referral filters | Avoids scans when resolving clinical linkage; referral writes are comparatively infrequent. |

`20260712073722_part_h_performance_indexes/migration.sql` contains no column/table/index drops, data mutations, deletes, truncation, or unrelated table alterations.
