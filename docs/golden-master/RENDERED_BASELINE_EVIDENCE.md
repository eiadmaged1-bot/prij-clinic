# Rendered Baseline Evidence

## Status

Golden Master rendered-baseline checkpoint: **COMPLETE**

## Source

- Repository: `eiadmaged1-bot/prij-clinic`
- Inventory branch at capture: `work/golden-master-inventory`
- Verified local HEAD: `aca85c86c88bf268954ad834baff0929d212bb71`
- Working tree: clean
- Golden Master branch: `golden-master/prij-identical-copy`

## Runtime

- Health result: status up
- Node.js: `v24.18.0`
- npm: `11.16.0`
- Docker: `29.5.3`
- Docker Compose: `v5.1.4`

## Appearance configuration

- Theme: **Dr Maged Premium**
- Source theme identifier: `prij-heritage`
- Interface mode: **Optimized**
- Density: **Comfortable**
- Appearance scope: **This device**
- Doctor Comfort Mode: **Off here**
- Sidebar: **Dark**
- Accent: warm brown / copper
- Reduced motion: off
- High contrast: off

## Captured surfaces

### Desktop

Captured from a 1980×1080 display:

- Login — English
- Owner Control Center — upper and lower sections
- Doctor Home — upper and lower sections
- Reception Home — English

### Mobile

Captured at approximately 390×844:

- Doctor Home — English
- Reception Home — English
- Reception Home — Arabic RTL

## Role-shell evidence

### Owner

- Grouped dark sidebar
- Dashboard, Clinic, Patients, Clinical Work, Knowledge, Admin and Messages
- Global patient search and owner actions
- Operational KPIs, readiness, pending tasks, management, services and audit

### Doctor

- Today / Waiting, Patients, Case Library, Messages, Guidelines and More
- Current patient, waiting list, appointments, results, follow-ups and recent activity

### Reception

- Reception, New Patient, Returning Patient / QR, Waiting Line and Calendar
- Check-in, new-patient and queue actions
- Queue preview

## Visual baseline

The Golden Master must preserve:

- deep-green desktop sidebar
- warm ivory canvas
- white bordered cards
- teal primary actions
- warm copper accent
- serif display headings
- current iconography, spacing, borders, shadows and radii
- role-specific navigation
- compact mobile header
- current English and Arabic copy during the identical-copy phase

## Existing source defects to preserve until upgrade

1. Doctor mobile current-patient card wraps awkwardly.
2. Arabic Reception retains an English `Refresh` control.
3. The mobile clinic name is truncated.
4. Empty operational states create large blank areas.
5. Some dashboards require multiple viewport captures.

## Data note

The user confirmed that visible patient names in the screenshots are fake/test records. No real clinical detail was intentionally included.

## Acceptance result

The manual evidence gate is complete:

- branch and commit confirmed
- clean working tree confirmed
- runtime health confirmed
- Owner, Doctor and Reception desktop shells confirmed
- Doctor and Reception mobile shells confirmed
- Arabic RTL Reception confirmed
- theme, mode and density confirmed

## Next phase

Begin identical Golden Master construction on `golden-master/prij-identical-copy`.

The first implementation unit is the shared application shell and login/session surface. No redesign, component substitution or workflow simplification is permitted.
