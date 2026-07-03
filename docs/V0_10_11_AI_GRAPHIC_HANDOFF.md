# V0.10.11 AI Graphic Handoff

Branch: `ui/v0.10.11-ai-graphic-handoff`.

Scope: design/export only. This sprint creates a static AI/graphic designer handoff package from the integrated secure base. It does not change backend clinical logic, database schema, CORS hardening, image sanitizer behavior, `queueDate`, encounter voiding, or queue duplicate remediation.

## Source Status

The v0.10.4 static HTML lab is already present in this branch:

- `scripts/export-ui-theme-html.mjs`
- `scripts/v104-serve-static-html-lab.mjs`
- `design:export-html`
- `design:serve-html`
- `design:package-html`
- `docs/V0_10_4_MOBILE_STABLE_HTML_LAB.md`

No merge or cherry-pick from `origin/ui/v0.10.4-mobile-stable-html-lab` was required.

## Handoff Files

```text
ai-graphic-handoff/
ai-graphic-handoff/README.md
ai-graphic-handoff/AI_REDESIGN_BRIEF.md
ai-graphic-handoff/DESIGN_RULES.md
ai-graphic-handoff/THEME_TOKENS.md
ai-graphic-handoff/SCREEN_LIST.md
ai-graphic-handoff/DO_NOT_CHANGE.md
ai-graphic-handoff/html/
ai-graphic-handoff/css/
ai-graphic-handoff/js/
ai-graphic-handoff/assets/
ai-graphic-handoff/single-file/
```

## Included Screens

- Dashboard
- Login Preview
- Patients
- Patient File
- Doctor Workspace
- Calendar
- Queue
- Prescriptions
- Investigations
- Billing
- Admin / Owner Control
- Drug Market
- Guidelines
- Protocol Atlas
- Theme Gallery
- Mobile Drawer

## Single-File HTML

- `ai-graphic-handoff/single-file/prij-dashboard.html`
- `ai-graphic-handoff/single-file/prij-patient-file.html`
- `ai-graphic-handoff/single-file/prij-doctor-workspace.html`
- `ai-graphic-handoff/single-file/prij-admin.html`
- `ai-graphic-handoff/single-file/prij-mobile-shell.html`

## Packaging

Command:

```powershell
npm run design:ai-handoff
```

The script rebuilds `ui-export` if missing, copies only sanitized handoff files to ignored storage staging, scans for secret-like patterns and forbidden claims, creates the zip, removes staging, and prints:

```text
storage/ui-export/prij-clinic-ai-graphic-handoff-v0.10.11.zip
```

The generated zip remains ignored by Git.

## Safety Notes

The package contains placeholder UI only. It includes no real patient data, medication data, uploads, secrets, logs, backups, databases, screenshots, PDF/Excel files, release tags, AI diagnosis, AI prescribing, or medication dosing automation.
