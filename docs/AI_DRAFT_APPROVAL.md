# AI Draft Approval

AI draft artifacts store draft type, patient id, optional encounter id, generated draft text, source context summary, disabled provider metadata, creator, reviewer, status, review timestamp, and review note.

Allowed review outcomes include approved and rejected, but approval means only that the draft artifact was reviewed. It does not create a final clinical note, prescription, dose, investigation request, diagnosis, or patient instruction.

Rejected drafts require a rejection reason. All review actions are audited with `insertedIntoClinicalRecord: false`.
