# Investigation Workflow

## v1.5.0 behavior

Investigation baskets persist per user and encounter in `InvestigationOrderDraft`, with session storage only as a client fallback. Templates add items but never submit orders. Duplicate active orders and recent reviewed results require explicit confirmation. Responsibility, internal/external route, expected date, template version, and lifecycle history are stored on the authoritative order.

Lifecycle transitions are validated and audited. Reception/Admin handle booking states, Nurse/clinical roles handle sampling/performed states, and Doctor/Owner authority is required for clinical review or override. Critical results retain explicit acknowledgement requirements.

History stores previous results; Plan stores new requests with an active visit. CBC/TSH categories normalize to the API enum. Mobile tabs are `Catalog | Sets | Follow-up | Manage`; failures preserve selection.

Clinical requests begin from Patient File → active visit → Investigations. The standalone page is the catalog, reusable-set, and cross-patient follow-up center and cannot save an unscoped request.

Doctors add catalog items to a reorderable basket, record indications/priority/follow-up, save to the visit, and print the saved request through a dedicated A4 route. Applying a set creates an editable basket and never orders automatically.

The catalog and result-lifecycle limitations are recorded in `KNOWN_LIMITATIONS.md`.
