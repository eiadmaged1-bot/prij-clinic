# Part H Index Rationale & Search Optimization

As part of the Part H Architecture and Performance Consolidation (Phase 6 & 7), targeted indexes were added and server-side matching limits were enforced.

## 1. Added Indexes

### `Patient` Table
- `@@index([phone])`
  - **Rationale:** Telephone number lookup is heavily utilized by receptionists. This index drastically cuts the search time from a full-table scan to millisecond lookup times for returning patients attempting to check in via phone number.

### `Appointment` Table
- `@@index([status, startAt])`
  - **Rationale:** Ensures fast querying for active or upcoming appointments in specific time windows (e.g., retrieving the day's queue or tomorrow's agenda). The compound index perfectly aligns with queries filtering active patients for the doctor's pipeline.

### `AuditLog` Table
- `@@index([branchId, createdAt])`
  - **Rationale:** The Audit Log grows indefinitely. A compound index on Branch and Date allows admins to swiftly retrieve recent branch-specific events without causing high database load, which is critical for security and operational monitoring.

## 2. Server-side Limits

- The patient search service (`PatientSearchService`) strictly enforces a `take: 100` clause. This mitigates excessive data transfer and client-side processing overloads during vague or empty query parameters, reducing potential Out-of-Memory (OOM) instances on both the Prisma engine and the mobile client payload parsing step.
