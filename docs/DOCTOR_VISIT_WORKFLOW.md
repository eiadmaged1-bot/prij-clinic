# Doctor Visit Workflow

The active patient visit uses one expanded step at a time:

1. History
2. Care Assist
3. Encounter
4. Prescription
5. Investigations
6. Follow-up
7. Review and Print

The active patient and visit status remain visible. Save and continue, Previous, and Next preserve draft progress, while completed steps can be revisited before finalization. Required validation blocks completion when required encounter or review fields are missing.

Care Assist is collapsible and explicitly requires doctor review. Its empty state does not infer findings, and it cannot autonomously write a diagnosis, assessment, treatment, medication, dose, or final clinical record.

Encounter fields include chief complaint, HPI, examination, assessment, and plan. Completion/signature uses the existing permission and audit controls. Once signed, an encounter is immutable through normal editing and requires an audited amendment path.

Prescription templates and medication shortcuts are doctor-owned starting points. Applying one creates an editable draft for the selected patient; the doctor must review patient context and required alerts before saving or printing. Investigation sets similarly create requests, not clinical recommendations.
