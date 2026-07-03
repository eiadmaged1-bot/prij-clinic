# v0.12.2 Clinical Reference Catalogs + Patient History Workspace

v0.12.2 adds clinic-app reference catalogs for generic medication lookup, investigation requests/history, operation history, and structured OB/GYN patient history sheets.

Boundaries:
- Generic medication names only.
- No trade names, brand names, pricing, inventory, stock, cart, checkout, or sales workflows.
- No automated dosing, prescribing, treatment ranking, or AI drug recommendation.
- Controlled generic medication rows are not seeded by default; controlled categories are reference-only.
- Investigation catalog is for requests/history only, not interpretation.
- Operation catalog is for past surgical history documentation only.
- Patient history sheets are structured documentation, not diagnosis automation.

Commands:

```powershell
npm run prisma:migrate:deploy
npm run prisma:generate
npm run db:v122:seed:clinical-reference
npm run test:v122:clinical-reference
```

Implemented:
- `MedicationGeneric`, `MedicationSearchTag`, `MedicationGenericTag`, `MedicationClass`.
- Generic medication search APIs under `/reference`.
- Expanded investigation and operation seed scripts.
- Patient history sheet and catalog-linked history item tables.
- Patient workspace History Sheet tab.
- Prescription item optional generic-catalog selection that stores and prints generic names.

v0.12.3 target: Care Assist plus pregnancy/lactation medication safety profiles, still doctor-reviewed and draft-only.
