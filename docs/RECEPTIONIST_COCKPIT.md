# Receptionist Cockpit

v1.3.3 makes Receptionist cockpit-only. Receptionist has no menu or sidebar.

The cockpit is one screen: Waiting now, Next patient, New Patient, Returning Patient, Waiting Line, Messages, and Account/Logout.

The top bar keeps Prij Clinic, Messages, Language, and Account/Logout. With-doctor status is not a main receptionist card.

New Patient saves with the primary action `Save and add to waiting line`, then returns to the cockpit with an added-to-queue message. Back and cancel actions return to Reception, not Patient Files.

Returning Patient is the receptionist path for search/QR and queue add. The receptionist normal workflow should not route through the generic Patient Files loop.
