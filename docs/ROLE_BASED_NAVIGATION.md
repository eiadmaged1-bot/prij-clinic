# Role-Based Navigation

v1.3.3 compresses mobile navigation into role-based groups while preserving v1.3.2 safety features.

Logout is visible from the top-right account menu for every role and sticky at the bottom of drawer navigation when a drawer exists.

Receptionist has no menu/sidebar and remains cockpit-only. The top bar keeps Prij Clinic, Messages, Language, and Account/Logout.

Doctor mobile navigation shows Today / Waiting, Patients, Case Library, Messages, Guidelines, More, and Logout. More is collapsed by default and contains clinical tools such as prescriptions, investigations, ultrasound, encounters, reports, AI Tools, and pharmacology.

Owner/Admin mobile navigation shows Dashboard, Clinic, Patients, Clinical Work, Knowledge, Admin, Messages, and Logout. There is no separate More section.

Only one group opens at a time, only one route appears active, and parent groups do not get a child-style active marker.
