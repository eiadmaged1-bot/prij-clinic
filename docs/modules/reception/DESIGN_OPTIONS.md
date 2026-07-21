# Reception Module — Design Options

## Design principles

All options must be:

- functional rather than decorative
- mouse-first
- compact and symmetric
- branch-scoped
- compatible with English and Arabic RTL
- safe for Reception permissions
- based on the existing patient, appointment and queue contracts
- free from duplicated queue state

## Option A — Single Command Center

### Structure

```text
Header: Reception · language · account · sync state

Today strip:
Scheduled | Arrived | Waiting | With doctor | Completed

Primary actions:
[Find patient] [New patient] [Check in] [Book appointment]

Selected patient context:
Identity | contact verified | appointment | intake | payment status

Main body:
Left  — Today appointments
Right — Live waiting line

Bottom drawer:
Check-in / booking / cancellation form
```

### Strengths

- Fastest daily workflow
- Minimal page switching
- Good for one receptionist handling around 30 patients per day
- Easy to use with mouse and touch
- Keeps appointments and queue visible together

### Risks

- Can become crowded unless advanced actions stay inside drawers
- Requires strict information hierarchy on mobile

## Option B — Patient Flow Board

### Structure

```text
Search and actions

Scheduled → Arrived → Waiting → With doctor → Completed
```

Patients appear as movable operational cards. Clicking a card opens permitted actions.

### Strengths

- Excellent visual understanding of clinic flow
- Easy to see bottlenecks
- Useful for larger reception teams

### Risks

- Drag-and-drop may cause accidental state changes
- Harder to use on a narrow phone
- Requires stronger confirmation and accessibility behavior
- More complex than needed for the clinic’s current volume

## Option C — Task Launcher with Separate Lists

### Structure

```text
Large actions:
Check in | New patient | Returning patient | Queue | Calendar

Below:
Queue summary and alerts
```

This is an improved version of the current Reception Home.

### Strengths

- Lowest implementation risk
- Familiar to current users
- Easy visual parity with the existing app

### Risks

- Still requires repeated navigation
- Does not achieve the desired single-workspace workflow
- Keeps Reception dependent on several separate routes

## Recommended option

**Option A — Single Command Center**

This option best matches the intended workflow:

- almost all daily operations from one page
- fewer keyboard actions
- patient selection persists during work
- appointments and waiting line remain visible
- no cosmetic-only modules
- advanced actions stay hidden until needed

## Recommended desktop arrangement

```text
┌────────────────────────────────────────────────────────────────────┐
│ Reception   Search patient / MRN / phone / QR   EN | عربي | Logout│
├────────────────────────────────────────────────────────────────────┤
│ Scheduled 12 │ Arrived 5 │ Waiting 4 │ Doctor 1 │ Completed 9     │
├────────────────────────────────────────────────────────────────────┤
│ Find patient │ New patient │ Check in │ Book appointment           │
├───────────────────────────────┬────────────────────────────────────┤
│ Today appointments            │ Live waiting line                  │
│ time · patient · status       │ position · patient · wait · action │
│                               │                                    │
├───────────────────────────────┴────────────────────────────────────┤
│ Selected patient context / compact action drawer                   │
└────────────────────────────────────────────────────────────────────┘
```

## Recommended mobile arrangement

```text
Compact header
Today flow chips
Search
Primary action row
Selected patient context
Tabbed list: Appointments | Waiting
Sticky permitted action bar
```

## Navigation recommendation

For a Receptionist-only account, the full desktop sidebar should be replaced with:

- Reception Home
- Language
- Logout

New Patient, Returning Patient, Waiting Line and Calendar become functional sections or drawers inside Reception Home rather than permanent navigation entries.

Owner/Admin users may retain broader navigation because their role context differs.

## Interaction recommendation

Use clicks and chips for:

- visit type
- appointment status
- queue priority
- branch
- doctor
- check-in method
- cancellation reason category

Use typing only for:

- patient search
- new patient identity/contact data
- required free-text reason when policy demands it
- exceptional operational note

## Approval gate

No Reception UI code should be changed until one design direction is approved:

- Option A — Single Command Center
- Option B — Patient Flow Board
- Option C — Improved Task Launcher

The recommendation is Option A.
