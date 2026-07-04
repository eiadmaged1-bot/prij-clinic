# Universal Live Search

`GET /search/live?q=&scope=` returns role-filtered typeahead sections:
- Patients
- Medications
- Investigations
- Prescriptions
- Requests/Follow-up
- Documents

The frontend debounces queries and supports keyboard navigation. Accountant access does not include clinical search sections.

