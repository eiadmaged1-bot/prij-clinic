# Offline Sync Design

## Purpose
This document defines a conservative offline mode for Prij Clinic. Offline support should preserve clinic continuity without allowing unsafe clinical finalization, hidden conflicts, or unaudited changes.

Offline mode is a design target. It should not be implemented until authentication, RBAC, audit logging, and core online workflows are stable.

## Offline Principles
- Offline mode is limited and explicit.
- Users must sign in online before offline access is available.
- Offline data is scoped to the authenticated user, branch, and permitted workflows.
- Local storage must be encrypted where platform support allows it.
- Offline writes enter a sync queue and are not considered final server records until accepted by the server.
- The server remains the source of truth.
- Audit events generated offline must sync with the related change.

## What Works Offline
Recommended MVP-compatible offline features:
- View today's cached appointment list for the user's authorized branch or doctor scope.
- View today's cached queue summary.
- Create local queue status updates for already cached queue entries.
- Record local assistant preparation notes for already cached queue entries.
- Draft encounter notes locally for the logged-in doctor.
- Draft prescription content locally without approval or finalization.
- Draft investigation requests locally without final submission.
- Record local payment intent notes only if clinic policy accepts delayed server confirmation.
- Capture report receipt metadata locally without file upload.

All offline-created clinical content must be labeled as unsynced draft until accepted by the server.

## What Does Not Work Offline
The following should require online server confirmation:
- New user login from a device that has not authenticated online.
- User, role, permission, branch, or security setting changes.
- Patient merge or duplicate resolution.
- Final encounter signing.
- Prescription approval or finalization.
- Report file upload, download, export, deletion, or void.
- Investigation final review.
- AI draft generation or review.
- Consent override.
- Billing refunds, reversals, voids, or high-risk adjustments.
- Audit log export.
- Backup or restore operations.

## Local Data Scope
Offline cache should be limited to:
- Current user profile, roles, permissions, and branch scopes from last successful online session.
- Today's appointments and queue for authorized scope.
- Minimal patient identifiers needed for the queued workflow.
- Draft notes created by the current user.
- Sync queue records and local audit draft events.

Do not cache unnecessary full patient histories, full report files, or broad billing data offline.

## Sync Queue Model
Each offline action should create a sync queue item:
- `local_id`
- `server_id null until synced`
- `resource_type`
- `operation`
- `payload`
- `base_version`
- `created_at_local`
- `created_by_user_id`
- `branch_id`
- `status`
- `retry_count`
- `last_error`
- `audit_event_payload`

Statuses:
- `pending`
- `syncing`
- `synced`
- `conflict`
- `rejected`
- `failed`

## Versioning
Server-managed records should expose a version field or `updated_at` value used as `base_version` for offline edits.

The server accepts an offline change only if:
- The user still has permission.
- The branch scope still matches.
- The record still exists and is editable.
- The submitted `base_version` does not conflict, or the operation has a safe merge rule.
- Required consent and workflow constraints are still satisfied.

## Conflict Rules

### Queue Status
- Server order of truth wins for completed, cancelled, no-show, and with doctor states.
- If two offline status changes conflict, server keeps the latest accepted server transition and marks the later conflicting sync item for manual review.
- Completed queue entries cannot be reopened offline.

### Preparation Notes
- Multiple notes can append if each has its own author and timestamp.
- Editing another user's prep note offline is not allowed.

### Encounter Drafts
- Drafts by the same doctor can merge only if based on the same version and non-overlapping fields.
- If fields overlap, mark conflict and require doctor review.
- Signed encounters cannot be edited offline.

### Prescriptions
- Offline prescriptions remain drafts only.
- Approval requires online doctor action after server validation.
- If the linked encounter changes or is signed before sync, require doctor review before accepting the draft.

### Investigations
- Offline investigation requests remain drafts until synced.
- If encounter or patient consent status changed before sync, server may reject or require review.

### Billing
- Offline payment notes must not reduce balances until accepted by the server.
- Refunds, reversals, discounts, and voids are online-only.

### Consent
- Consent creation may be drafted offline only if clinic policy allows it.
- Consent withdrawal or override should be online-only.
- Workflows requiring consent must re-check server consent state during sync.

## Audit Log Sync
Offline audit events should be created locally for each offline action. On sync:
- The protected data change and its audit event should be submitted together.
- Server writes the authoritative audit log with original local timestamp and server receipt timestamp.
- Audit event must identify that the action originated offline.
- If a sync item is rejected, server should audit the rejected attempt when it reached the server.

Audit fields for offline events:
- `origin = offline`
- `local_occurred_at`
- `server_received_at`
- `device_id`
- `sync_queue_item_id`
- `conflict_status`

Do not store full clinical note bodies or report contents in audit payloads.

## Device and Session Controls
- Offline mode requires a recent successful online session.
- Offline access expires after a configured time window.
- Lost or disabled accounts must lose offline sync permission when the server next sees the device.
- Device identifiers should be generated per installation and not expose secrets.
- Local cache should support remote invalidation on next connection.

## Security Requirements
- Encrypt local offline storage where possible.
- Protect cached data with OS-level user security and application session controls.
- Do not store passwords, API keys, tokens, or report storage secrets in offline cache.
- Do not cache full report files in MVP offline mode.
- Clear offline cache on logout where policy requires.

## UX Requirements
- Clearly label offline mode.
- Clearly label unsynced drafts.
- Show sync status and conflicts.
- Block online-only actions with direct explanations.
- Require user review before discarding conflicted local drafts.

## Implementation Recommendation
For MVP, start with online-first functionality and design data models to support future offline sync. Implement offline only after core auth, RBAC, audit, and workflow tests are reliable.
