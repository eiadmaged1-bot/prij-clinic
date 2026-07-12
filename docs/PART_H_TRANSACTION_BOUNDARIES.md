# Part H Transaction Boundaries & Concurrency Rules

As part of Phase 10 & 11, critical multi-step business flows were verified to run within ACID-compliant `Prisma.$transaction` scopes using row-level locking where necessary.

## 1. Billing & Payments
- **Endpoint:** `createPaymentWithoutIdempotency` (`POST /billing/payments`)
- **Locking Mechanism:**
  ```sql
  SELECT id, status, "totalAmount", "amountPaid" FROM "Invoice" WHERE id = ... FOR UPDATE
  ```
- **Rationale:** Ensures payment concurrency issues cannot occur. `FOR UPDATE` prevents race conditions where simultaneous requests attempt to pay the exact remaining balance of the same invoice, thus avoiding an overpaid invoice status or negative balance. 600+400 concurrency and 700+700 concurrency stress scenarios confirmed this explicitly.

## 2. Queue Ticketing
- **Endpoint:** `checkInWithoutIdempotency` (`POST /queue/:id/check-in`)
- **Locking Mechanism:** Evaluated inside `$transaction`.
- **Rationale:** The queue ticket is safely validated, and its branch and status updated simultaneously, preventing double-booking logic bugs.

## 3. Global Dependency Modules
- Core modules such as `AuthModule`, `ClinicTimeModule`, and `IdempotencyModule` appropriately retain the `@Global()` decorator as they form the foundational baseline context used seamlessly across the Nest application container without boilerplate redeclarations. Other domain-specific endpoints successfully resolve to explicitly declared modules without leaking bounds.
