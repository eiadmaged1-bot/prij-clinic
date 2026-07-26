param(
  [string]$SourceRepo = 'C:\Newfolder\prij-clinic',
  [string]$RunRoot = 'C:\Newfolder\prij-clinic-runs'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-Step {
  param([string]$Name, [scriptblock]$Action)
  Write-Host "`n===== $Name =====" -ForegroundColor Cyan
  & $Action
  if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE." }
}

function Write-Utf8NoBom {
  param([string]$Path, [string[]]$Lines)
  [System.IO.File]::WriteAllLines($Path, $Lines, (New-Object System.Text.UTF8Encoding($false)))
}

if (-not (Test-Path -LiteralPath $SourceRepo)) { throw "Source repository not found: $SourceRepo" }
$origin = (& git -C $SourceRepo remote get-url origin).Trim()
if ($LASTEXITCODE -ne 0 -or -not $origin) { throw 'Could not determine origin URL.' }

Invoke-Step 'Fetch QA and controls branches' {
  git -C $SourceRepo fetch origin security/rbac-scope-enforcement work/sprint1-qa-repair-batch
}

$qaSha = (& git -C $SourceRepo rev-parse origin/work/sprint1-qa-repair-batch).Trim()
$rxEvidence = & git -C $SourceRepo show 'origin/work/sprint1-qa-repair-batch:docs/verification/QA_STRUCTURED_RX_RESULT.md' 2>$null
if ($LASTEXITCODE -ne 0 -or ($rxEvidence -join "`n") -notmatch 'Full regression suite: PASS') {
  throw 'Structured prescription evidence is not green on work/sprint1-qa-repair-batch. Run the medication/Rx package first.'
}

$envFile = Join-Path $SourceRepo '.env'
if (-not (Test-Path -LiteralPath $envFile)) { throw "Missing local environment file: $envFile" }
$allowedEnv = @('DATABASE_URL','JWT_SECRET','JWT_EXPIRES_IN','AI_FEATURES_ENABLED','AI_PROVIDER')
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
if (-not $databaseFound) { throw 'DATABASE_URL was not loaded.' }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
New-Item -ItemType Directory -Force $RunRoot | Out-Null
$workspace = Join-Path $RunRoot "feature47-$stamp"
$controls = Join-Path $RunRoot "feature47-controls-$stamp"
$backupRef = "backup/pre-feature47-$stamp"

Invoke-Step 'Create remote Feature 47 backup checkpoint' {
  git -C $SourceRepo push origin "$qaSha`:refs/heads/$backupRef"
}
Invoke-Step 'Clone verified QA branch' {
  git clone --branch work/sprint1-qa-repair-batch --single-branch $origin $workspace
}
Invoke-Step 'Clone controls branch' {
  git clone --branch security/rbac-scope-enforcement --single-branch $origin $controls
}

$clonedQaSha = (& git -C $workspace rev-parse HEAD).Trim()
if ($clonedQaSha -ne $qaSha) { throw "QA branch moved during clone: expected $qaSha, got $clonedQaSha." }
Invoke-Step 'Create Feature 47 local branch' {
  git -C $workspace switch -c feature/47-complaint-severity-evolution
}

$patches = @(
  (Join-Path $controls 'scripts\runner\apply-feature47-severity-evolution-tsx.mjs'),
  (Join-Path $controls 'scripts\runner\apply-feature47-severity-evolution-css.mjs')
)
foreach ($patch in $patches) {
  if (-not (Test-Path -LiteralPath $patch)) { throw "Missing Feature 47 patch: $patch" }
  Invoke-Step "Apply $(Split-Path $patch -Leaf)" { node $patch $workspace }
}
Invoke-Step 'Verify Feature 47 patch formatting' { git -C $workspace diff --check }

Push-Location $workspace
try {
  Invoke-Step 'Install dependencies' { npm ci }
  Invoke-Step 'Generate Prisma Client' { npm run prisma:generate }

  $referenceSource = Join-Path $SourceRepo 'local-reference\egyptian-drugs'
  $referenceFile = Join-Path $referenceSource 'egyptian-drugs.csv'
  if (-not (Test-Path -LiteralPath $referenceFile)) { throw "Missing medication reference: $referenceFile" }
  $referenceTarget = Join-Path $workspace 'local-reference\egyptian-drugs'
  New-Item -ItemType Directory -Force $referenceTarget | Out-Null
  Copy-Item -Path (Join-Path $referenceSource '*') -Destination $referenceTarget -Recurse -Force

  Invoke-Step 'Build API prerequisite' { npm run build --workspace @prij-clinic/api }

  $feature47Contract = Join-Path $controls 'scripts\feature-47-severity-evolution-contract-test.mjs'
  $medContract = Join-Path $controls 'scripts\qa-medication-cards-contract-test.mjs'
  $rxContract = Join-Path $controls 'scripts\qa-structured-rx-contract-test.mjs'
  foreach ($contract in @($feature47Contract,$medContract,$rxContract)) {
    if (-not (Test-Path -LiteralPath $contract)) { throw "Missing contract: $contract" }
  }

  Invoke-Step 'Feature 47 severity evolution contract' { node $feature47Contract }
  Invoke-Step 'Feature 46 regression' { node scripts/feature-46-refractory-complaint-test.mjs }
  Invoke-Step 'Clinical workflow regression' { node scripts/clinical-workflow-unification-test.mjs }
  Invoke-Step 'Pregnancy and EDD regression' { node scripts/qa-pregnancy-edd-contract-test.mjs }
  Invoke-Step 'Calendar and History regression' { node scripts/qa-calendar-history-contract-test.mjs }
  Invoke-Step 'Medication-card regression' { node $medContract }
  Invoke-Step 'Structured prescription regression' { node $rxContract }
  Invoke-Step 'Medication recovery regression' { node scripts/recovery-fix3-medication-test.mjs }
  Invoke-Step 'Search recovery regression' { node scripts/recovery-fix3-search-test.mjs }
  Invoke-Step 'Typecheck' { npm run typecheck }
  Invoke-Step 'Production build' { npm run build }

  $verificationDir = Join-Path $workspace 'docs\verification'
  New-Item -ItemType Directory -Force $verificationDir | Out-Null
  Write-Utf8NoBom (Join-Path $verificationDir 'FEATURE47_SEVERITY_EVOLUTION_RESULT.md') @(
    '# Feature 47 Complaint Severity Evolution Verification','',
    "- Verification source: local SECTRA run `$stamp`",
    '- Severity values: `MILD`, `MODERATE`, `SEVERE`',
    '- Snapshot source: clinician documented only',
    '- Signed encounters only in longitudinal view: PASS',
    '- Last three signed points: PASS',
    '- Provenance fields: PASS',
    '- Automatic diagnosis or treatment suggestion: NONE',
    '- Automatic improvement/deterioration inference: NONE',
    '- Feature 46 regression: PASS',
    '- Complete regression suite: PASS',
    '- Migration/seed/reset/delete/truncate: NOT RUN',
    '- Production data modified: NO'
  )

  git config user.name 'sectra-local-runner'
  git config user.email 'sectra-local-runner@local.invalid'
  git add -- 'apps/web/components/clinic/ActiveVisitWorkspace.tsx' 'apps/web/app/globals.css' 'docs/verification/FEATURE47_SEVERITY_EVOLUTION_RESULT.md'
  $allowedFiles = @(
    'apps/web/components/clinic/ActiveVisitWorkspace.tsx',
    'apps/web/app/globals.css',
    'docs/verification/FEATURE47_SEVERITY_EVOLUTION_RESULT.md'
  )
  $staged = @(git diff --cached --name-only)
  $unsafe = @($staged | Where-Object { $allowedFiles -notcontains $_ })
  if ($unsafe.Count -gt 0) { throw "Unsafe staged files: $($unsafe -join ', ')" }
  Invoke-Step 'Verify staged Feature 47 diff' { git diff --cached --check }
  Invoke-Step 'Commit verified Feature 47' { git commit -m 'Implement and verify Feature 47 complaint severity evolution' }
  $verifiedSha = (& git rev-parse HEAD).Trim()

  Invoke-Step 'Push verified Feature 47 branch' {
    git push origin HEAD:feature/47-complaint-severity-evolution
  }
  $qaBeforePush = (& git ls-remote origin refs/heads/work/sprint1-qa-repair-batch).Split("`t")[0].Trim()
  if ($qaBeforePush -ne $qaSha) {
    throw "QA branch moved from $qaSha to $qaBeforePush. Feature 47 remains preserved on its feature branch."
  }
  Invoke-Step 'Fast-forward QA repair branch with Feature 47' {
    git push origin HEAD:work/sprint1-qa-repair-batch
  }

  Write-Host "`nFEATURE 47 VERIFIED and pushed: $verifiedSha" -ForegroundColor Green
  Write-Host "Backup checkpoint: $backupRef" -ForegroundColor Green
  Write-Host "Workspace preserved at: $workspace" -ForegroundColor Green
}
finally {
  Pop-Location
}
