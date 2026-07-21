# Investigation Station QA Checklist

## Database

- Catalogue seed completes after migrations.
- Accordion categories and subcategories are derived from active catalogue records.
- Favorites persist per user.
- Personal lists persist and can be duplicated or archived.
- Active-encounter baskets restore from saved drafts.
- Submitted requests are linked to the selected patient and encounter.

## Workflow

- Search matches name, code, category, modality, sample type, and aliases.
- Items can be added, removed, and reordered.
- Shared templates fill the editable basket without ordering automatically.
- Duplicate active orders and prior reviewed results require another confirmation.
- Result follow-up actions persist and remain permission-scoped.

## Interface

- Category plus/minus controls expand and collapse correctly.
- Desktop, mobile, English, and Arabic layouts remain usable.
- Loading, empty, and failure states are visible.

## Release gate

- Standard CI succeeds.
- The complete security pipeline succeeds.
- Desktop and mobile screenshots are approved.
- Manual testing uses authorized accounts and the local clinic database.
- Nothing is merged before explicit approval.
