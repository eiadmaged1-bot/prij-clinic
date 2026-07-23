# Investigation Station workflow rebuild

## Implemented

- Direct Doctor/Owner patient ordering from Investigation Station without creating a fabricated encounter.
- Encounter-embedded investigation ordering without the former connected-workspace handoff.
- Patient search, change, clear selection, and open-patient-file controls.
- Guarded patient changes when an editable basket contains investigations.
- Desktop clinical workspace proportions: categories : catalogue : basket = 1 : 3 : 2.
- Independent category/catalogue scrolling with a sticky order basket.
- Separate Templates tab; guidance-only zero-item entries are separated from actionable templates.
- Canonical database taxonomy with expandable/collapsible medical departments and nested subcategories.
- API validation that blocks new noncanonical top-level catalogue categories.
- Expanded OB-GYN investigation reference catalogue.
- Multi-select and Add selected workflow.
- Favorite and recent quick-add chips.
- Prior-order/result visibility beside catalogue items.
- Duplicate active-order and prior-reviewed-result confirmation gates.
- Correct print routes for encounter requests and standalone investigation orders.
- Database persistence, patient scope enforcement, RBAC, and audit logging.

## Pending approval

- Desktop visual review.
- Mobile visual review.
- Real-user workflow review.
- Explicit approval before merge.
