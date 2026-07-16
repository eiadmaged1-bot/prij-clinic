# v1.5.0 Connected Clinical Platform

Base: `afc5b4205954506b844b26a6c556a52d70eccc0a`.

The sprint connects operational patient recovery, layouts, investigations, ultrasound, knowledge, medications, intake, governance, and audit without creating a second source of clinical truth. Two forward migrations extend investigation draft/lifecycle fields and ultrasound lifecycle enum values. No migration drops data or rewrites prior migrations.

The activation repair was idempotent and audited: 549 REAL legacy archived patients became active; TEST, QUARANTINED, MERGED, and deleted classifications were excluded. Batch identifier: `4f766b39-e507-466a-8187-9b53ca5557b6`.

Automated tests do not authorize autonomous diagnosis, ordering, prescribing, signing, protocol activation, or patient changes. All such actions remain permission-bound and doctor-reviewed.
