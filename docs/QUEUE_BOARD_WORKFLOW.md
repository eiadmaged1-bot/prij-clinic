# Queue Board Workflow

The v1.3.3 Queue Board has one source of truth for today's queue.

## Layout

- Date selector.
- Reception / Doctor tabs.
- Summary: Waiting, Next, Urgent, Completed.
- One queue list only.

Rows use compact operational wording:

`Patient name - visit type - waiting - added by Receptionist - time`

Statuses shown in UI are standardized as scheduled, checked-in, waiting, next, with doctor, paused where supported, completed, cancelled, and follow-up due. Backend legacy values such as `called` are displayed as `with doctor`.

The old duplicated queue status panels and daily operations loop are not part of the Queue Board view.
