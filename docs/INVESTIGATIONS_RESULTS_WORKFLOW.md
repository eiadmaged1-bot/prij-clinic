# Investigations And Results Workflow

V0.7 adds result metadata separate from final clinical interpretation.

## Workflow

1. Doctor or authorized staff creates an investigation order.
2. Order can record source, type, department/provider routing, priority, and demo billing status.
3. Staff records result metadata.
4. Abnormal and critical flags remain visible until review.
5. Doctor reviews result metadata and may acknowledge critical flags.
6. Review and acknowledgement are audited.

## Clinical Boundary

- Structured values are recording-only.
- Critical/abnormal flags are workflow flags, not diagnosis.
- No automatic diagnosis.
- No automatic treatment suggestion.
- No AI result interpretation.
- Doctor comment is doctor-authored only.
