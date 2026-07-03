# Medication Safety Side Terminal

The medication safety terminal appears beside medication search and prescription drafting.

It shows generic name, optional trade/search match if present, class/family, legacy pregnancy category badge, lactation profile badge, source, review status, confidence, last checked, last updated, source version, and review warnings.

Profiles are review-gated. Unknown, unreviewed, missing-source, or stale/unknown freshness states show Review required. The UI must not say a profile is up to date today unless a persisted source refresh actually ran today.

The terminal must not display safe in pregnancy wording, treatment recommendations, dosing automation, or patient instruction text.
