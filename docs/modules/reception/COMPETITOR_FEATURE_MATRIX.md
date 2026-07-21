# Reception Module — Competitor Feature Matrix

## Research method

This matrix extracts workflow ideas from current official product information. It does not copy any vendor interface, wording or visual design.

## Products reviewed

- athenahealth / athenaOne
- eClinicalWorks / healow Check-In
- Tebra
- Cliniko

## Feature matrix

| Capability | athenahealth | eClinicalWorks | Tebra | Cliniko | Prij decision |
|---|---|---|---|---|---|
| Online self-scheduling | Supported | Supported | Supported | Highly configurable | V2; not required for initial receptionist workspace |
| Digital pre-arrival check-in | Supported | Supported | Digital intake supported | Connected-app pattern | V2 |
| In-clinic kiosk check-in | Partner / digital check-in model | Strong kiosk workflow | Not core emphasis | Not core emphasis | Future; QR/tablet mode only after core workflow |
| Patient demographic confirmation | Supported | Strong check-in confirmation | Digital intake | Patient booking records | V1 |
| Consent and form completion | Supported | Supported during check-in | Digital intake | Forms/integrations | V1 status visibility; form completion workflow in V2 |
| Automated reminders | Supported | Supported | Supported | SMS and email reminders | V1 reminder status; outbound automation later |
| Patient waitlist | Automated waitlist scheduling | Queue/check-in focus | Scheduling automation | Filtered waitlist | V1 manual waitlist; V2 automated slot matching |
| Urgent online queue | Supported in engagement tools | Urgent-care workflow | Not primary | Not primary | Existing Prij urgent queue remains core MVP |
| Appointment cancellation/reschedule | Supported | Supported | Supported | Configurable patient cancellation | V1 |
| Appointment-type matching | AI-assisted roadmap | Configured scheduling | Online scheduling | Configurable booking types | V1 manual smart chips; Future assistive AI suggestion |
| Multi-channel communication | Text, portal and voice direction | Portal/messenger ecosystem | Text, email and phone reminders | SMS and email | V2; preserve consent and audit requirements |
| Payment collection at check-in | Practice-management integration | Copay/payment workflows | Strong patient-payment emphasis | Integration-dependent | V1 read-only balance/status; payment entry remains Billing permissioned |
| Insurance/eligibility confirmation | Practice-management workflow | Strong check-in support | Practice-management emphasis | Limited relevance | Future/optional for local clinic model |
| Waiting-time reduction | Digital check-in and online queue | Kiosk check-in | Intake automation | Calendar/waitlist efficiency | MVP through compact live queue and elapsed-time display |
| Front-desk workload reduction | Self-service and automation | Kiosk and linked intake | Scheduling/intake automation | Configurable booking/reminders | Primary Prij design goal |
| AI receptionist | Current/announced patient communication tools | AI ecosystem direction | AI-enabled patient engagement | Connected-app ecosystem | Future only; non-clinical, consent-aware and staff-supervised |

## Most useful ideas for Prij

### 1. One operational workspace

Reception should see the full non-clinical patient flow without opening separate pages for every task:

- scheduled
- arrived
- waiting
- called / with doctor
- completed
- cancelled

### 2. Pre-check readiness

Before check-in, show compact operational readiness indicators:

- identity confirmed
- phone confirmed
- appointment exists
- intake complete
- consent status
- payment-status visibility when permitted

These are operational indicators, not clinical judgements.

### 3. Persistent patient context

After selecting a patient, maintain the selected context while Reception performs:

- appointment booking
- check-in
- visit-type selection
- queue placement
- contact verification

### 4. Waitlist and open-slot workflow

A later version should allow Reception to filter patients waiting for a slot by:

- doctor
- branch
- appointment type
- preferred day/time
- urgency classification approved by clinic policy

### 5. Mouse-first workflow

Use:

- visit-type chips
- appointment-status chips
- one-click patient actions
- quick filters
- compact drawers
- clear operational badges

Typing should be limited to patient search, required reasons and exceptional notes.

### 6. Automation without autonomous clinical action

Future assistance may:

- suggest matching appointment slots
- draft reminder messages
- identify patients eligible for a cancelled slot
- summarize unanswered operational requests

It must not:

- clinically triage a patient
- change urgency without authorized staff confirmation
- provide medical advice
- expose clinical notes to Reception
- confirm or cancel appointments without an auditable workflow

## Ideas rejected for the first upgrade

- Copying a kiosk interface into the staff workspace
- Placing billing forms directly on Reception Home
- Displaying full medical history at check-in
- Autonomous AI phone handling
- Automatically changing queue priority
- Creating a second queue state separate from the existing queue API
- Replacing role permissions with UI-only hiding

## Research conclusion

The strongest useful pattern is not adding more dashboard cards. It is consolidating scheduling, patient lookup, check-in and queue status into a single, branch-scoped operational surface with clear patient context and fewer clicks.
