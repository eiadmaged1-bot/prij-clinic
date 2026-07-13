# Smart Clinical Tags

Structured history tags provide doctor-controlled, searchable metadata without converting tags into diagnoses or automated clinical conclusions.

Each definition has a stable code, display name, category, aliases, and active state. A patient assignment records current/historical status, date or year, structured detail JSON, manual note, creator, and audit timestamps. Changes and searches are audited and subject to role/scope checks.

The patient History tab shows one category at a time. A doctor can add a predefined tag with one click, edit details, mark it current or historical, remove it, create a custom tag, or add a manual note. Medication history supports an exact generic when known or a broader family/clinical group, plus current/previous/stopped state, dates, indication, and notes.

Seeded categories cover presenting complaints, gynecology symptoms/diagnoses, obstetric history, pregnancy risks, medical/surgical/family/social history, procedures, medications, allergies, previous investigations, and follow-up/admin. Included examples include AUB, PCOS, fibroid, endometriosis, hysterectomy, myomectomy, previous Cesarean section, laparoscopy, hysteroscopy, D&C, cerclage, and IVF/ICSI procedure.

Smart Clinical Search supports one or multiple terms and returns only authorized patient matches with MRN, matching tag/date/status, and last visit context. Examples such as `PCOS + metformin` are intersections of stored metadata, not generated diagnoses. No search mutates a patient record.
