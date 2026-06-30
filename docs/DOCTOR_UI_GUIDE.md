# Doctor UI Guide

The doctor-facing UI should stay calm, readable, and patient-centered.

## Principles

- Patient file is the center of clinical work.
- The doctor writes clinical impressions and plans.
- AI draft tools are off or doctor-reviewed and never final by themselves.
- Large and magnified density modes should improve readability without hiding tabs.
- Avoid tiny controls for primary doctor actions.

## Patient File

Required patient tabs are kept in `patientTabRegistry` and are independent of theme. If content is not implemented, show a compact empty state rather than a large blank card.

## Doctor Mode

Doctor Mode should prioritize:

- Open patient
- Start visit
- Write note
- Prescribe
- Order tests
- Follow up
- Finish visit
