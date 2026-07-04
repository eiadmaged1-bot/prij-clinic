# Clinic Daily Operations Loop

The daily loop is: appointment scheduled, patient checked in, queue ticket created, doctor waiting list, visit started or resumed, visit completed, and billing/payment note reviewed if present.

Reception uses `/reception/today`, `/reception/check-in`, `/calendar`, and `/queue`. Doctors use `/doctor/waiting` and the patient workspace Doctor Visit tab.

Cancellation and no-show reasons are captured through status update endpoints and included in audit metadata. Queue cancellation also requires a reason.

No clinical decision support is exposed to reception. Queue priority is operational only and is not emergency triage.
