# Care Assist Engine

Care Assist stores local rules and generated findings for documentation completeness, follow-up review, and medication safety visibility.

Endpoints:
- `GET /care-assist/rules`
- `POST /care-assist/evaluate`
- `GET /care-assist/findings?patientId=`
- `POST /care-assist/findings/:id/decision`

Allowed outputs:
- Missing field reminders.
- Follow-up reminders.
- Safety-check reminders.
- Review-required medication safety flags.
- Source/review-status warnings.

Forbidden outputs:
- Diagnosis.
- Prescribing.
- Dose, frequency, duration, or instructions.
- Drug choice or treatment ranking.

Doctor/Admin/Owner can evaluate and view findings. Owner/Admin can manage rules. Decisions are audited.
