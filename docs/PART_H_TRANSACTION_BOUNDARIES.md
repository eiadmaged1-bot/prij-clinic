# Part H Transaction Boundaries and Concurrency Rules

All behavioral verification used isolated synthetic records in disposable databases.

## Billing and Payments

Payment creation locks the invoice row inside a Prisma transaction before checking the outstanding balance. Concurrent 600+400 payments both succeed and settle the invoice without lost updates. Concurrent 700+700 attempts permit only one payment and reject the overpayment path. Relevant payment/audit records remain consistent.

## Queue Transitions

Queue state changes use conditional transactional updates. A real concurrent transition race produces one valid winner; the losing request cannot overwrite the resulting state. Queue audit behavior remains intact.

## Patient Registration and Visit Start

Patient registration, duplicate prevention, and Save & Start Visit use one transaction boundary. A forced failure does not leave a patient without its requested visit or a visit without its patient. Concurrent matching creation requests do not create duplicates.

## Patient Document Promotion

Document metadata creation and encrypted-file promotion expose a recoverable failure boundary. When promotion fails after the database insert, the document is retained as `ORPHANED`/recoverable and is not downloadable as a ready document. Temporary/quarantine cleanup and audit behavior were verified.

## Verification

`scripts/production-launch-transaction-boundaries-test.mjs` exercises these runtime paths rather than inspecting source strings. It verifies payment races, queue races, document promotion failure, patient/visit consistency, and associated audit behavior against a fresh `_test_part_h_` database.
