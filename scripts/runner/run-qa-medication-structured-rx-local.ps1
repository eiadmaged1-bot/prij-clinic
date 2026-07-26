param(
  [string]$SourceRepo = 'C:\Newfolder\prij-clinic',
  [string]$RunRoot = 'C:\Newfolder\prij-clinic-runs'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][scriptblock]$Action
  )
  Write-Host "`n===== $Name =====" -ForegroundColor Cyan
  & $Action
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE."
  }
}

function Write-Utf8NoBom {
  param([string]$Path, [string[]]$Lines)
  [System.IO.File]::WriteAllLines($Path, $Lines, (New-Object System.Text.UTF8Encoding($false)))
}

if (-not (Test-Path -LiteralPath $SourceRepo)) {
  throw "Source repository not found: $SourceRepo"
}

$origin = (& git -C $SourceRepo remote get-url origin).Trim()
if ($LASTEXITCODE -ne 0 -or -not $origin) {
  throw 'Could not determine the GitHub origin URL.'
}

$envFile = Join-Path $SourceRepo '.env'
if (-not (Test-Path -LiteralPath $envFile)) {
  throw "Missing local environment file: $envFile"
}

$backupRef = 'backup/pre-qa-structured-rx-20260726'
& git -C $SourceRepo ls-remote --exit-code --heads origin $backupRef | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Missing required backup branch: $backupRef"
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
New-Item -ItemType Directory -Force $RunRoot | Out-Null
$workspace = Join-Path $RunRoot "qa-medication-structured-rx-$stamp"
$controls = Join-Path $RunRoot "qa-controls-$stamp"

Write-Host "SECTRA local verification workspace: $workspace" -ForegroundColor Green
Write-Host "SECTRA controls workspace: $controls" -ForegroundColor Green

Invoke-Step 'Clone structured prescription branch' {
  git clone --branch work/sprint1-qa-structured-rx --single-branch $origin $workspace
}

Invoke-Step 'Clone controls branch' {
  git clone --branch security/rbac-scope-enforcement --single-branch $origin $controls
}

$baseQaSha = (& git -C $workspace rev-parse HEAD).Trim()
$remoteQaSha = (& git -C $workspace ls-remote origin refs/heads/work/sprint1-qa-repair-batch).Split("`t")[0].Trim()
if (-not $remoteQaSha) {
  throw 'Could not resolve work/sprint1-qa-repair-batch.'
}
if ($baseQaSha -ne $remoteQaSha) {
  throw "Structured-Rx branch base $baseQaSha does not match QA branch $remoteQaSha. Refusing a branch race."
}

$allowedEnv = @('DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'AI_FEATURES_ENABLED', 'AI_PROVIDER')
$databaseFound = $false
foreach ($line in Get-Content -LiteralPath $envFile) {
  $trimmed = $line.Trim()
  if (-not $trimmed -or $trimmed.StartsWith('#') -or -not $trimmed.Contains('=')) { continue }
  $parts = $trimmed.Split('=', 2)
  $key = $parts[0].Trim()
  if ($allowedEnv -notcontains $key) { continue }
  $value = $parts[1].Trim().Trim('"').Trim("'")
  [Environment]::SetEnvironmentVariable($key, $value, 'Process')
  if ($key -eq 'DATABASE_URL' -and $value) { $databaseFound = $true }
}
if (-not $databaseFound) {
  throw 'DATABASE_URL was not loaded.'
}

$patches = @(
  (Join-Path $controls 'scripts\runner\apply-qa-medication-cards.mjs'),
  (Join-Path $controls 'scripts\runner\apply-qa-structured-rx-tsx.mjs'),
  (Join-Path $controls 'scripts\runner\apply-qa-structured-rx-css.mjs')
)
foreach ($patch in $patches) {
  if (-not (Test-Path -LiteralPath $patch)) { throw "Missing patch: $patch" }
  Invoke-Step "Apply $(Split-Path $patch -Leaf)" {
    node $patch $workspace
  }
}

Invoke-Step 'Verify patch formatting' {
  git -C $workspace diff --check
}

Push-Location $workspace
try {
  Invoke-Step 'Install dependencies' { npm ci }
  Invoke-Step 'Generate Prisma Client' { npm run prisma:generate }

  $referenceSource = Join-Path $SourceRepo 'local-reference\egyptian-drugs'
  $referenceFile = Join-Path $referenceSource 'egyptian-drugs.csv'
  if (-not (Test-Path -LiteralPath $referenceFile)) {
    throw "Missing local medication reference: $referenceFile"
  }
  $referenceTarget = Join-Path $workspace 'local-reference\egyptian-drugs'
  New-Item -ItemType Directory -Force $referenceTarget | Out-Null
  Copy-Item -Path (Join-Path $referenceSource '*') -Destination $referenceTarget -Recurse -Force

  Invoke-Step 'Build API prerequisite' { npm run build --workspace @prij-clinic/api }

  $medicationContract = Join-Path $controls 'scripts\qa-medication-cards-contract-test.mjs'
  $rxContract = Join-Path $controls 'scripts\qa-structured-rx-contract-test.mjs'
  foreach ($contract in @($medicationContract, $rxContract)) {
    if (-not (Test-Path -LiteralPath $contract)) { throw "Missing contract: $contract" }
  }

  Invoke-Step 'QA medication-card contract' { node $medicationContract }
  Invoke-Step 'QA structured prescription contract' { node $rxContract }
  Invoke-Step 'QA Calendar and History regression' { node scripts/qa-calendar-history-contract-test.mjs }
  Invoke-Step 'QA pregnancy and EDD regression' { node scripts/qa-pregnancy-edd-contract-test.mjs }
  Invoke-Step 'Feature 46 regression' { node scripts/feature-46-refractory-complaint-test.mjs }
  Invoke-Step 'Clinical workflow regression' { node scripts/clinical-workflow-unification-test.mjs }
  Invoke-Step 'Medication recovery regression' { node scripts/recovery-fix3-medication-test.mjs }
  Invoke-Step 'Search recovery regression' { node scripts/recovery-fix3-search-test.mjs }
  Invoke-Step 'Typecheck' { npm run typecheck }
  Invoke-Step 'Production build' { npm run build }

  $verificationDir = Join-Path $workspace 'docs\verification'
  New-Item -ItemType Directory -Force $verificationDir | Out-Null

  Write-Utf8NoBom (Join-Path $verificationDir 'QA_CALENDAR_HISTORY_RESULT.md') @(
    '# QA Compact Calendar and History Verification',
    '',
    '- Tickets: `QA-CAL-001`, `QA-HIST-001`',
    "- Verification source: local SECTRA run `$stamp`",
    '- Complete regression suite: PASS',
    '- Migration/seed/reset/delete/truncate: NOT RUN',
    '- Production data modified: NO'
  )

  Write-Utf8NoBom (Join-Path $verificationDir 'QA_MEDICATION_CARDS_RESULT.md') @(
    '# QA Compact Medication Cards Verification',
    '',
    '- Ticket: `QA-MED-001`',
    "- Verification source: local SECTRA run `$stamp`",
    '- Trade-name-first compact cards: PASS',
    '- Full regression suite: PASS',
    '- Migration/seed/reset/delete/truncate: NOT RUN',
    '- Production data modified: NO'
  )

  Write-Utf8NoBom (Join-Path $verificationDir 'QA_STRUCTURED_RX_RESULT.md') @(
    '# QA Structured Prescription Controls Verification',
    '',
    '- Tickets: `QA-RX-001`, `QA-RX-002`',
    "- Verification source: local SECTRA run `$stamp`",
    '- Quantity per intake: STRUCTURED',
    '- Canonical timing: `q24h`, `q12h`, `q8h`',
    '- Arabic timing labels: PASS',
    '- Two tablets together q24h preset: PASS',
    '- Numeric duration with day/week units: PASS',
    '- Only one optional free-text Note: PASS',
    '- API compatibility normalisation: PASS',
    '- Full regression suite: PASS',
    '- Migration/seed/reset/delete/truncate: NOT RUN',
    '- Production data modified: NO'
  )

  git config user.name 'sectra-local-runner'
  git config user.email 'sectra-local-runner@local.invalid'
  git add -- 'apps/web/components/clinic/ActiveVisitWorkspace.tsx' 'apps/web/app/globals.css' 'docs/verification/QA_CALENDAR_HISTORY_RESULT.md' 'docs/verification/QA_MEDICATION_CARDS_RESULT.md' 'docs/verification/QA_STRUCTURED_RX_RESULT.md'

  $allowedFiles = @(
    'apps/web/components/clinic/ActiveVisitWorkspace.tsx',
    'apps/web/app/globals.css',
    'docs/verification/QA_CALENDAR_HISTORY_RESULT.md',
    'docs/verification/QA_MEDICATION_CARDS_RESULT.md',
    'docs/verification/QA_STRUCTURED_RX_RESULT.md'
  )
  $staged = @(git diff --cached --name-only)
  $unsafe = @($staged | Where-Object { $allowedFiles -notcontains $_ })
  if ($unsafe.Count -gt 0) {
    throw "Unsafe staged files: $($unsafe -join ', ')"
  }

  Invoke-Step 'Verify staged diff' { git diff --cached --check }
  Invoke-Step 'Commit verified QA package' { git commit -m 'Implement and verify medication cards and structured prescriptions' }
  $verifiedSha = (& git rev-parse HEAD).Trim()

  Invoke-Step 'Push verified structured prescription branch' {
    git push origin HEAD:work/sprint1-qa-structured-rx
  }

  $qaShaBeforePush = (& git ls-remote origin refs/heads/work/sprint1-qa-repair-batch).Split("`t")[0].Trim()
  if ($qaShaBeforePush -ne $remoteQaSha) {
    throw "QA branch moved from $remoteQaSha to $qaShaBeforePush. Verified commit $verifiedSha was preserved only on the structured-Rx branch."
  }

  Invoke-Step 'Fast-forward verified QA repair branch' {
    git push origin HEAD:work/sprint1-qa-repair-batch
  }

  Write-Host "`nSECTRA QA package VERIFIED and pushed: $verifiedSha" -ForegroundColor Green
  Write-Host "Workspace preserved at: $workspace" -ForegroundColor Green
}
finally {
  Pop-Location
}
