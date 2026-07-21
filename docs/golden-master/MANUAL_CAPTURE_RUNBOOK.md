# Golden Master Manual Runtime Capture Runbook

## Purpose

This is the first step that requires access to the local Windows application, local database and existing staff accounts. Repository inspection cannot determine the active browser/account theme, computed layout, real role navigation or printed output.

The runbook is read-only with respect to clinical data except where a later test is explicitly approved. The initial capture phase does **not** create, edit, seed, clean or migrate patient data.

## Safety rules

- Do not expose `.env` contents.
- Do not paste passwords, cookies, CSRF tokens or database connection strings into chat.
- Do not use real patient data in screenshots shared outside the protected project.
- Do not run seed or cleanup commands.
- Do not reset, stash, clean, revert or discard a dirty working tree.
- Do not switch branches while local uncommitted work exists.
- Do not tunnel API port 3001.
- Do not use a public tunnel for real patient data.
- Use existing local QA/training accounts and non-sensitive local records only.

## Stage 1 — Preflight

Open PowerShell in:

```powershell
cd C:\Newfolder\prij-clinic
```

Run:

```powershell
git status --short --untracked-files=all
git branch --show-current
git rev-parse HEAD
git log -5 --oneline
```

### Decision

- If `git status` is not empty: stop. Preserve the output and do not switch branches.
- If `git status` is empty: continue.

## Stage 2 — Open the inventory branch safely

```powershell
git fetch origin
git switch work/golden-master-inventory
git pull --ff-only origin work/golden-master-inventory
git status --short
git branch --show-current
git rev-parse HEAD
```

Expected:

- Branch: `work/golden-master-inventory`.
- Status: empty.
- The branch contains only documentation changes relative to the frozen source; application code remains identical to source commit `47c39e4478c9d91231bcdf05bdbcc7c63e597660`.

## Stage 3 — Record environment versions

```powershell
node --version
npm --version
docker --version
docker compose version
```

Record Windows display settings manually:

- Display resolution.
- Display scaling percentage.
- Browser name/version.
- Browser zoom, set to 100% for baseline screenshots.

Do not change display scaling during one screenshot set.

## Stage 4 — Start the existing local application

Do not seed or clean the database.

```powershell
npm run dev:stop
docker compose up -d postgres
npm run prisma:repair
npm run dev
```

`npm run dev` remains running. Use a second PowerShell window for any later commands.

Open:

```text
http://localhost:3000/login
http://localhost:3000/api/backend/health
```

Expected:

- Login renders.
- Health returns a safe successful response.
- API port 3001 remains internal.

If the app fails, capture only:

- the visible safe browser error.
- terminal error lines with secrets redacted.
- output of `git status --short`, branch and commit.

## Stage 5 — Create the evidence folder locally

From a second PowerShell window:

```powershell
cd C:\Newfolder\prij-clinic
New-Item -ItemType Directory -Force .\artifacts\golden-master\runtime | Out-Null
New-Item -ItemType Directory -Force .\artifacts\golden-master\screenshots\desktop | Out-Null
New-Item -ItemType Directory -Force .\artifacts\golden-master\screenshots\mobile | Out-Null
New-Item -ItemType Directory -Force .\artifacts\golden-master\screenshots\rtl | Out-Null
New-Item -ItemType Directory -Force .\artifacts\golden-master\screenshots\print | Out-Null
```

Do not commit screenshot files until PHI/PII review is complete.

## Stage 6 — Record active visual configuration

After login with the Owner account, open Appearance and record:

- Active theme name/ID.
- Interface mode: OPTIMIZED or MINIMALISTIC.
- Density: Comfort, Large or Compact.
- Doctor Comfort Mode: on/off.
- Appearance scope currently applied: device/account/role/clinic where visible.
- User theme override allowed: yes/no.

Do not change these values during the first baseline set.

Save this information in:

```text
artifacts/golden-master/runtime/ACTIVE_VISUAL_CONFIGURATION.txt
```

Do not include account identifiers beyond role names.

## Stage 7 — Initial screenshots required before full capture

Capture these four screenshots first at browser zoom 100%:

1. `desktop/001-login-en-1440x900.png`
2. `desktop/002-owner-control-1440x900.png`
3. `desktop/003-doctor-home-1440x900.png`
4. `desktop/004-reception-home-1440x900.png`

Also capture:

5. `mobile/001-doctor-home-390x844.png`
6. `mobile/002-reception-home-390x844.png`

And one RTL checkpoint:

7. `rtl/001-reception-home-ar-390x844.png`

These first screenshots validate the correct source, active theme, shell, role routing and responsive mode before spending time on the full route inventory.

## Stage 8 — Role capture protocol

For each role:

1. Log out through the UI.
2. Log in with the existing local QA/training account.
3. Do not share credentials.
4. Confirm landing route.
5. Capture the navigation open state.
6. Capture the account menu open state.
7. Capture the mobile drawer where applicable.
8. Record inaccessible routes as permission evidence, not as defects.

Roles:

- Owner.
- Admin.
- Doctor.
- Receptionist.
- Accountant.
- Nurse only when a working local account and intended frontend contract exist.

## Stage 9 — Screenshot method

Recommended browser method:

- Use DevTools device toolbar for fixed viewport captures.
- Disable device frame.
- Set device pixel ratio consistently.
- Keep browser zoom at 100%.
- Capture viewport screenshots, not arbitrary cropped images.
- Keep data non-sensitive and consistent across original/Golden Master comparisons.

Required viewport set:

```text
360x800
390x844
430x932
768x1024
1024x768
1280x800
1440x900
```

The initial checkpoint uses only 390×844 and 1440×900. Full coverage starts after source/theme confirmation.

## Stage 10 — Data/privacy review before sharing

Before sending or committing a screenshot, verify:

- No real patient full name.
- No real phone number.
- No national ID/passport.
- No address.
- No real medical record details.
- No private document contents.
- No email/password fields containing credentials.
- No browser DevTools tokens/cookies.
- No terminal secrets.

Use existing safe QA/training records. Do not create fake clinical records solely for screenshots.

## Stage 11 — Runtime metadata file

Create:

```text
artifacts/golden-master/runtime/RUNTIME_BASELINE.txt
```

Template:

```text
Captured date:
Windows version:
Display resolution:
Display scaling:
Browser/version:
Browser zoom:
Node version:
npm version:
Docker version:
Compose version:
Git branch:
Git commit:
Web URL:
Proxy health: PASS/FAIL
Database reachable: PASS/FAIL
Active theme:
Interface mode:
Density:
Doctor Comfort Mode:
Owner landing:
Doctor landing:
Reception landing:
Accountant landing:
Nurse status: VERIFIED/BLOCKED/NOT CONFIGURED
Notes:
```

Do not include secrets or personal identifiers.

## Stage 12 — First manual handoff back to the project review

Provide:

- The four command outputs from Stage 1.
- The final branch/commit/status from Stage 2.
- Environment versions from Stage 3.
- Safe health result.
- Active visual configuration.
- The seven initial screenshots.

After those are reviewed, the project can lock the correct theme and begin the complete screenshot manifest. No identical-copy coding starts before this checkpoint passes.

## Failure handling

### Dirty working tree

Stop and provide only:

```powershell
git status --short --untracked-files=all
git branch --show-current
git rev-parse HEAD
```

No reset, stash, clean or branch switch.

### App does not start

Provide:

- safe error lines.
- branch/commit/status.
- whether PostgreSQL container is running:

```powershell
docker compose ps
```

### Login fails

Do not paste credentials. Record:

- role attempted.
- visible error category.
- whether `/api/backend/health` works.
- whether the account worked before.

### Route denied

Record:

- role.
- requested route.
- landing route after redirect.
- screenshot.

A safe redirect may be correct behavior.
