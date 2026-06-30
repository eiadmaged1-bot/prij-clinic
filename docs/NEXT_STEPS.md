# Next Steps

## Exact Next Step

Master Source-of-Truth Audit.

## V0.6 Follow-Up

1. Continue source-of-truth audit now that the shell, density controls, theme tab preservation, and seeded demo catalog visibility are stabilized.
2. Review every verified calculator formula with a qualified clinician before real-world use.
3. Expand medication safety rules only from licensed or approved official sources.
4. Add formal approval workflows for formulas, protocols, guideline documents, and medication rules.
5. Keep AI disabled/extractive/local and draft-only until consent, privacy, vendor, audit, and doctor-review controls are formally approved.
6. Improve browser-level visual coverage for calculator, AI management, guideline, medication, drug-market, theme switching, and density switching surfaces.
7. Add backup/restore proof for database metadata plus any encrypted guideline or uploaded files.

Do not use real patient data until production privacy, security, clinical governance, backup, incident response, and legal reviews are complete.
# Premium UI Next Steps

- Continue replacing generic MVP record pages with workflow-specific pages.
- Move the full `AppShell` implementation from `mvp-page.tsx` into the new shell component boundary.
- Use the patient workspace component boundary for smaller patient subpanels.
- Add browser screenshot QA for each theme and density once Playwright is available.
- Consider Radix primitives only where native controls are not sufficient.
