# Reception Module — Feature Roadmap

## Classification rule

Features are classified by operational value, dependency risk and implementation sequence.

## MVP — Reception Workspace Upgrade

The MVP is the first approved Reception upgrade. It must work with existing APIs and permissions.

| Feature | Purpose | Acceptance condition |
|---|---|---|
| Single Reception workspace | Reduce navigation between Home, patient lookup, check-in and queue | Core tasks can be completed from one workspace or one compact drawer |
| Today flow summary | Show scheduled, arrived, waiting, with doctor and completed counts | Counts come from existing appointment and queue APIs |
| Global patient lookup | Find returning patients by name, phone, MRN or QR | Uses the shared branch-scoped patient search |
| New-patient action | Start patient registration quickly | Opens the existing registration workflow without duplication |
| Selected-patient context bar | Keep the chosen patient visible during operational actions | Patient identity remains visible until cleared or workflow completes |
| Visit-type chips | Reduce typing during check-in | All approved visit types remain available and keyboard accessible |
| Idempotent check-in | Prevent duplicate queue entries | Existing idempotency contract remains intact |
| Live queue list | Show patient names, queue positions, status and waiting duration | Uses the shared queue API and queue-change event |
| Next-patient indicator | Make the next operational handoff obvious | Urgent and routine ordering matches backend queue rules |
| Operational actions | Open profile, call patient and cancel with reason where permitted | Every action uses existing permissioned endpoints |
| Compact empty/loading/error states | Avoid large blank cards | States remain explicit and do not fabricate records |
| English and Arabic RTL | Preserve role workflow in both languages | All Reception-owned labels are translated |
| Role isolation | Prevent clinical navigation leakage | Reception-only account cannot open doctor-only surfaces |
| Desktop/mobile parity | Same workflow at desktop and phone widths | No horizontal overflow and primary actions remain usable |

## V1 — Operational Completion

| Feature | Purpose |
|---|---|
| Today’s appointments list | Show booked patients and appointment status inside Reception |
| Quick appointment booking | Book from the selected-patient context using approved slots |
| Reschedule/cancel/no-show actions | Complete routine appointment lifecycle with required reasons |
| Duplicate patient warning | Warn before creating a likely duplicate patient |
| Contact confirmation | Confirm phone and basic identity data at arrival |
| Intake readiness badges | Show incomplete non-clinical intake or consent tasks |
| Payment-status visibility | Show balance/status only when the receptionist has permission |
| Queue filters | Filter waiting, urgent, called, completed and cancelled |
| Appointment/queue search | Find a patient already in today’s flow |
| Check-in receipt/ticket | Print or display queue number without exposing clinical details |
| Last-sync indicator | Show whether queue and appointment data are current |
| Audit reason prompts | Require reasons for cancellation or sensitive operational changes |

## V2 — Patient Self-Service and Automation

| Feature | Purpose |
|---|---|
| Pre-arrival digital intake | Let patients complete non-clinical forms before arrival |
| Consent completion workflow | Collect approved consent forms before or during check-in |
| Reminder status and responses | Show sent, delivered, confirmed, reschedule and cancellation states |
| Manual waitlist management | Track patients seeking earlier appointments |
| Open-slot matching | Suggest matching waitlist patients when a slot opens |
| Tablet/QR check-in | Support supervised patient self-check-in |
| Two-way operational messaging | Handle appointment and arrival questions with consent and audit |
| Branch handoff | Transfer approved appointments between clinic branches |
| Reception task inbox | Consolidate unresolved operational requests |

## Future

| Feature | Safety boundary |
|---|---|
| AI appointment assistant | Suggest slots only; staff confirms all changes |
| AI reminder drafting | Draft non-clinical messages; staff approves templates and campaigns |
| AI call summary | Summarize operational calls without producing medical advice |
| Automated waitlist outreach | Requires consent, clinic rules and auditable patient response |
| Voice receptionist | Restricted to scheduling and routine operational questions; staff escalation required |
| Predictive no-show signals | Operational prioritization only; must not deny access or discriminate |
| Insurance eligibility integration | Optional external integration with strict PHI/PII controls |

## Explicitly rejected

- Automatic clinical triage by Reception AI
- Clinical note visibility in Reception
- Autonomous urgency changes
- Unreviewed automatic appointment cancellation
- Storing a separate local queue that can diverge from the backend
- Payment-card data entry outside approved billing infrastructure
- Removing audit reasons from cancellation and reversal actions
- Hiding permission failures instead of enforcing backend permissions

## Recommended delivery order

```text
MVP shell and live flow
→ patient selection and check-in
→ queue actions
→ appointment lifecycle
→ intake/payment readiness indicators
→ self-service and messaging
→ supervised AI assistance
```
