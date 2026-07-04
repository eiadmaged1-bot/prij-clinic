# Medication Safety Source Review Prep

v0.12.5 prepares medication pregnancy/lactation source review. It does not populate reviewed clinical safety claims.

## Admin workflow

The admin page at `/admin/medication-safety-profiles` lists profiles needing review and shows:

- generic name
- pregnancy category/status
- lactation status
- source name
- source year
- source URL
- last checked date
- source last updated date
- review status
- confidence level

Owner/Admin users can mark a profile as `needs_review`, `reviewed`, or `retired`.

## Review requirements

Reviewed status requires:

- source name
- review reason
- reviewer, saved by the server
- reviewed timestamp, saved by the server

All review changes use the existing guarded PATCH endpoint and write `medication_safety_profile.updated` audit entries.

## Boundaries

- No official source claims were imported in this sprint.
- No fake pregnancy/lactation safety claims were added.
- Category E remains invalid and maps to `REVIEW_REQUIRED`.
- No profile should claim it is up to date today unless a refresh actually ran today and persisted the date/status.
- Real reviewed data import is next.
