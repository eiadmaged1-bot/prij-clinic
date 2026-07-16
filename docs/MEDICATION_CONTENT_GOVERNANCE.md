# Medication Content Governance

## v1.5.0 inventory and blocker

Current database inventory: 63 active generic identities, 53 families, 56 memberships, and 7 unlinked identities (11.1%). The only approved source registered is **ATC/DDD Index 2026**, WHO Collaborating Centre for Drug Statistics Methodology. It supports identity/classification only.

Clinical section counts are zero for mechanism, pharmacodynamics, pharmacokinetics, renal, hepatic, pregnancy/lactation, and antimicrobial spectrum. The UI therefore reports Source incomplete or Needs review per section. Empty rooms are hidden from the Doctor room browser; Admin governance retains incomplete coverage. No uses, mechanisms, safety claims, pregnancy statements, renal guidance, or doses were fabricated.

## Safety boundary

The Clinical Drug Atlas is an assistive reference. A medication identity, alias, family membership, or attached source is not a verified clinical profile. Clinical facts remain incomplete until a pharmacology reviewer and an authorized clinical approver review the relevant section. The atlas does not automatically select treatment, diagnose, dose, or finalize a prescription.

## Governed pipeline

Content moves through these explicit stages:

1. source registration;
2. source import;
3. normalized generic identity;
4. alias resolution, with trade names kept separate;
5. medication-family mapping;
6. clinical-room mapping;
7. structured section drafts;
8. section-level source attachment;
9. pharmacology review;
10. clinical approval;
11. publication.

Skipping review or approval is not supported. Updating an identity or family link does not approve any clinical section.

## v1.4.9 identity release

The seed is idempotent and registers the **ATC/DDD Index 2026**, published by the WHO Collaborating Centre for Drug Statistics Methodology, as an authoritative classification source: <https://atcddd.fhi.no/atc_ddd_index/>. The associated identity rows remain `needs_review`, and their family memberships remain `catalog_only`.

This release links 43 normalized generic identities across respiratory, cardiovascular, anti-infective, gastrointestinal, endocrine, neuropsychiatry, pain, allergy, and supplement families. Respiratory coverage includes SABA, LABA, LAMA, and inhaled corticosteroid families. Cardiovascular coverage includes ACE inhibitor, ARB, beta blocker, calcium-channel blocker, thiazide, loop diuretic, potassium-sparing diuretic, and statin families.

Only identity and broad family classification are imported. The release does **not** import uses, mechanism, pharmacodynamics, pharmacokinetics, adverse effects, contraindications, interactions, pregnancy/lactation advice, renal/hepatic advice, monitoring, dose, antimicrobial susceptibility, or treatment protocols. Those sections display as incomplete unless separately supported and reviewed.

## Browse behavior

Rooms show linked-generic counts and coverage state. Families with no mapped generic are grouped as incomplete. Generic profiles expose source and review states, and prescription insertion is available only as a draft action from an active patient context.

## Known content limitation

ATC classification supports identity navigation; it is not sufficient evidence for patient-specific clinical recommendations. Licensing and source-review work for clinical monographs remains outstanding, so unsupported sections intentionally remain empty rather than being generated.
