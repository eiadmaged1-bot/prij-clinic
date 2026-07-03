# Reference Data Foundation

v0.12.1 establishes reference catalogs for useful local clinic workflows without seeding fake patient activity.

## Investigation Catalog

The existing `InvestigationCatalogItem` catalog is seeded idempotently with OB/GYN-relevant laboratory, radiology, ultrasound, and pathology/cytology names. These are order/catalog names only. No results, interpretations, diagnoses, or clinical recommendations are seeded.

## Operation Catalog

`OperationCatalogItem` stores operation/procedure names for patient surgical and procedure history. Fields include normalized name, category, specialty, body system, OB/GYN flag, surgical flag, source type, review status, and active status.

The catalog includes OB/GYN operations such as cesarean section, D&C, hysteroscopy, laparoscopy, myomectomy, hysterectomy variants, cerclage, biopsy procedures, ectopic pregnancy surgery, and pelvic floor repairs. It also includes general surgical history terms such as appendectomy, cholecystectomy, hernia repair, thyroidectomy, breast procedures, bariatric procedures, orthopedic fixation, cardiac catheterization, CABG, cataract surgery, rhinoplasty, and septoplasty.

## Service Catalog

The existing `ServiceItem` catalog can now hold service names without prices. v0.12.1 seeds service names with `price = null` and `reviewStatus = price_review_required`. Billing rejects unpriced catalog services until finance review adds a real price.

## Read-Only Reference API

Reference endpoints are authenticated and read-only:

- `/reference/investigations`
- `/reference/operations`
- `/reference/services`
- `/reference/medication-readiness`

No patient data is exposed through these endpoints.
