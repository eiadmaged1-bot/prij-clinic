[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Workspace,
  [Parameter(Mandatory = $true)][string]$Controls,
  [Parameter(Mandatory = $true)][string]$LogDir,
  [Parameter(Mandatory = $true)][string]$RunId
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$Stage = 'initialise'
$ContractHash = ''
$SpecHash = ''

function Invoke-LoggedCommand {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Command
  )

  New-Item -ItemType Directory -Force $LogDir | Out-Null
  $stdout = Join-Path $LogDir "$Name.stdout.log"
  $stderr = Join-Path $LogDir "$Name.stderr.log"
  $process = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/d', '/s', '/c', $Command) -NoNewWindow -Wait -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
  if (Test-Path -LiteralPath $stdout) { Get-Content -LiteralPath $stdout | ForEach-Object { Write-Host $_ } }
  if (Test-Path -LiteralPath $stderr) { Get-Content -LiteralPath $stderr | ForEach-Object { Write-Host $_ } }
  return [int]$process.ExitCode
}

function Invoke-Codex {
  param(
    [Parameter(Mandatory = $true)][string]$Prompt,
    [Parameter(Mandatory = $true)][string]$Name
  )

  New-Item -ItemType Directory -Force $LogDir | Out-Null
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  $promptPath = Join-Path $LogDir "$Name.prompt.txt"
  $stdout = Join-Path $LogDir "$Name.stdout.log"
  $stderr = Join-Path $LogDir "$Name.stderr.log"
  [System.IO.File]::WriteAllText($promptPath, $Prompt, $utf8NoBom)
  $process = Start-Process -FilePath 'codex.exe' -ArgumentList @('-a', 'never', '-s', 'workspace-write', 'exec', '--ephemeral') -NoNewWindow -Wait -PassThru -RedirectStandardInput $promptPath -RedirectStandardOutput $stdout -RedirectStandardError $stderr
  if (Test-Path -LiteralPath $stdout) { Get-Content -LiteralPath $stdout | ForEach-Object { Write-Host $_ } }
  if (Test-Path -LiteralPath $stderr) { Get-Content -LiteralPath $stderr | ForEach-Object { Write-Host $_ } }
  return [int]$process.ExitCode
}

function Assert-LockedContracts {
  $currentContract = (Get-FileHash -Algorithm SHA256 -LiteralPath 'scripts/qa-pregnancy-edd-contract-test.mjs').Hash
  $currentSpec = (Get-FileHash -Algorithm SHA256 -LiteralPath 'docs/verification/QA_PREGNANCY_EDD_IMPLEMENTATION_SPEC.md').Hash
  if ($currentContract -ne $ContractHash) { throw 'Locked pregnancy/EDD contract test was modified.' }
  if ($currentSpec -ne $SpecHash) { throw 'Locked pregnancy/EDD implementation specification was modified.' }
}

function Get-ChangedPaths {
  $paths = @()
  foreach ($line in @(git status --porcelain=v1 --untracked-files=all)) {
    if (-not $line -or $line.Length -lt 4) { continue }
    $path = $line.Substring(3)
    if ($path.Contains(' -> ')) { $path = ($path -split ' -> ')[-1] }
    $paths += $path
  }
  return @($paths | Sort-Object -Unique)
}

function Assert-AllowedImplementationChanges {
  $unsafe = @(
    Get-ChangedPaths | Where-Object {
      $_ -notlike 'apps/web/*' -and
      $_ -notlike 'packages/shared/*'
    }
  )
  if ($unsafe.Count -gt 0) { throw "Out-of-scope implementation files changed: $($unsafe -join ', ')" }
}

function Get-SafeLogTail {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return @() }
  return @(
    Get-Content -LiteralPath $Path -Tail 100 | ForEach-Object {
      $_ -replace 'postgres(?:ql)?://[^\s]+', '[REDACTED_DATABASE_URL]'
    }
  )
}

function Record-Failure {
  param([string]$Message)

  try {
    Set-Location $Controls
    git pull --ff-only origin security/rbac-scope-enforcement
    if ($LASTEXITCODE -ne 0) { throw 'Could not update controls checkout before writing failure report.' }

    New-Item -ItemType Directory -Force 'docs/verification' | Out-Null
    $lines = @(
      '# Latest QA Pregnancy and EDD Failure',
      '',
      "- Run ID: $RunId",
      "- Stage: $Stage",
      "- Error: $Message",
      '- Database migration/seed/reset/delete/truncate: NOT RUN',
      '- Production data modified: NO',
      '',
      '## Diagnostic tails'
    )

    if (Test-Path -LiteralPath $LogDir) {
      foreach ($file in Get-ChildItem -LiteralPath $LogDir -File | Sort-Object Name) {
        $lines += ''
        $lines += "### $($file.Name)"
        $lines += '```text'
        $lines += @(Get-SafeLogTail -Path $file.FullName)
        $lines += '```'
      }
    }

    $report = 'docs/verification/LATEST_QA_PREGNANCY_EDD_FAILURE.md'
    $lines | Set-Content -LiteralPath $report -Encoding utf8
    git config user.name 'github-actions[bot]'
    git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
    git add -- $report
    git commit -m "ci: record QA pregnancy EDD failure $RunId"
    if ($LASTEXITCODE -eq 0) {
      git push origin HEAD:security/rbac-scope-enforcement
      if ($LASTEXITCODE -ne 0) { Write-Host 'Failure report commit was created but could not be pushed.' }
    }
  } catch {
    Write-Host "Could not record failure report: $($_.Exception.Message)"
  }
}

try {
  $Stage = 'runner guard'
  if ($env:RUNNER_NAME -ne 'SECTRA') { throw "Expected SECTRA, got '$env:RUNNER_NAME'." }
  if ($env:RUNNER_OS -ne 'Windows') { throw "Expected Windows, got '$env:RUNNER_OS'." }
  if (-not (Test-Path -LiteralPath $Workspace)) { throw "Missing workspace: $Workspace" }
  if (-not (Test-Path -LiteralPath $Controls)) { throw "Missing controls checkout: $Controls" }
  if (Test-Path -LiteralPath $LogDir) { Remove-Item -LiteralPath $LogDir -Recurse -Force }
  New-Item -ItemType Directory -Force $LogDir | Out-Null

  Set-Location $Workspace
  if ((git branch --show-current).Trim() -ne 'work/sprint1-qa-repair-batch') { throw 'Wrong QA branch checked out.' }
  if (git status --porcelain) { throw 'QA branch checkout is not clean.' }
  foreach ($path in @('scripts/qa-pregnancy-edd-contract-test.mjs', 'docs/verification/QA_PREGNANCY_EDD_IMPLEMENTATION_SPEC.md')) {
    if (-not (Test-Path -LiteralPath $path)) { throw "Missing locked QA contract: $path" }
  }
  codex --version
  if ($LASTEXITCODE -ne 0) { throw 'Codex CLI is unavailable on SECTRA.' }
  $ContractHash = (Get-FileHash -Algorithm SHA256 -LiteralPath 'scripts/qa-pregnancy-edd-contract-test.mjs').Hash
  $SpecHash = (Get-FileHash -Algorithm SHA256 -LiteralPath 'docs/verification/QA_PREGNANCY_EDD_IMPLEMENTATION_SPEC.md').Hash
  $gitDir = (git rev-parse --git-dir).Trim()
  Add-Content -LiteralPath (Join-Path $gitDir 'info/exclude') -Value "`nlocal-reference/`n"

  $Stage = 'environment'
  $envPath = 'C:\Newfolder\prij-clinic\.env'
  if (-not (Test-Path -LiteralPath $envPath)) { throw "Missing local environment file: $envPath" }
  $allowedKeys = @('DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'AI_FEATURES_ENABLED', 'AI_PROVIDER')
  $databaseFound = $false
  foreach ($line in Get-Content -LiteralPath $envPath) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#') -or -not $trimmed.Contains('=')) { continue }
    $parts = $trimmed.Split('=', 2)
    $key = $parts[0].Trim()
    if ($allowedKeys -notcontains $key) { continue }
    $value = $parts[1].Trim().Trim('"').Trim("'")
    Set-Item -Path "Env:$key" -Value $value
    if ($key -eq 'DATABASE_URL' -and $value) { $databaseFound = $true }
  }
  if (-not $databaseFound) { throw 'DATABASE_URL was not loaded.' }
  Write-Host 'Local environment loaded without printing secret values.'

  $Stage = 'dependencies and prerequisites'
  if ((Invoke-LoggedCommand -Name 'setup-npm-ci' -Command 'npm ci') -ne 0) { throw 'npm ci failed.' }
  if ((Invoke-LoggedCommand -Name 'setup-prisma-generate' -Command 'npm run prisma:generate') -ne 0) { throw 'Prisma Client generation failed.' }

  $referenceSource = 'C:\Newfolder\prij-clinic\local-reference\egyptian-drugs'
  $referenceTarget = 'local-reference\egyptian-drugs'
  $referenceFile = Join-Path $referenceSource 'egyptian-drugs.csv'
  if (-not (Test-Path -LiteralPath $referenceFile)) { throw "Missing local medication reference: $referenceFile" }
  New-Item -ItemType Directory -Force $referenceTarget | Out-Null
  Copy-Item -Path (Join-Path $referenceSource '*') -Destination $referenceTarget -Recurse -Force
  if (-not (Test-Path -LiteralPath (Join-Path $referenceTarget 'egyptian-drugs.csv'))) { throw 'Medication reference copy failed.' }
  if ((Invoke-LoggedCommand -Name 'setup-api-build' -Command 'npm run build --workspace @prij-clinic/api') -ne 0) { throw 'API prebuild for search verification failed.' }

  $Stage = 'initial implementation'
  $implementationPrompt = @'
Inspect the real Prij Clinic codebase before editing. Implement only QA-PREG-001 and QA-EDD-001 on the checked-out work/sprint1-qa-repair-batch branch.

Locked files that MUST NOT be edited:
- scripts/qa-pregnancy-edd-contract-test.mjs
- docs/verification/QA_PREGNANCY_EDD_IMPLEMENTATION_SPEC.md

Required implementation:
1. Create packages/shared/src/pregnancy-dating.ts and export it through packages/shared/src/index.ts.
2. Implement calculateEddCandidate, confirmEddCandidate, and isPregnancyMenstrualUiSuppressed exactly as required by the locked contract.
3. Use ISO date-only UTC arithmetic: LMP +280 days; known conception +266 days; day-5 embryo transfer +261 days; day-3 transfer +263 days; ultrasound from explicit scan EDD or scan date plus the remaining days to 280 from explicit gestational weeks and days. Never infer dates from free text.
4. Calculations are candidate previews only. Never silently overwrite a confirmed EDD. A different confirmed EDD requires explicit replacement and a correction reason. Preserve mode, source, source date, confirmation date, clinician, correction reason, previous EDD, and datingHistory.
5. In ActiveVisitWorkspace, suppress ordinary current-cycle menstrual fields and ordinary menstrual abnormality flags during active pregnancy. Preserve and clearly display a read-only Pre-pregnancy menstrual baseline. Add pregnancyBleedingStatus and pregnancyBleedingOnsetDate fields.
6. Add manual and calculated EDD modes with source-specific structured fields for LMP, ultrasound, IVF embryo transfer, and known conception. Render a Calculation preview stating clinician confirmation required. Add Confirm authoritative EDD. Replacing a different confirmed EDD requires an explicit replacement choice and correction reason.
7. Keep signed encounter snapshots immutable and use existing encounter JSON persistence. No migration.
8. Update Patient Overview only as needed so active pregnancy is not displayed as ordinary active menstruation while historical menstrual timeline data remains available.
9. Do not implement ultrasound redating thresholds, diagnosis, treatment advice, calendar compaction, medication redesign, or prescription redesign in this package.
10. Keep UI compact and use narrowly scoped styling only when needed.

Safety rules:
- No migration, seed, database reset, delete, truncate, production-data access, reference-data edits, secrets, PHI, or external network calls.
- Do not weaken, delete, bypass, or modify the locked contract.
- Do not stage, commit, push, reset, clean, stash, or switch branches.
- Keep implementation changes limited to apps/web and packages/shared.
- Preserve Feature 46 and signed historical records.

Inspect before editing, implement fully, and finish with a concise changed-file summary. The outer controller runs every test and handles repairs.
'@
  $initialExit = Invoke-Codex -Prompt $implementationPrompt -Name 'implementation'
  Write-Host "Initial Codex implementation exit: $initialExit"

  $Stage = 'verification and repair'
  $checks = [ordered]@{
    'qa-pregnancy-edd' = 'node scripts/qa-pregnancy-edd-contract-test.mjs'
    'feature46' = 'node scripts/feature-46-refractory-complaint-test.mjs'
    'clinical-workflow' = 'node scripts/clinical-workflow-unification-test.mjs'
    'fix3-medication' = 'node scripts/recovery-fix3-medication-test.mjs'
    'fix3-search' = 'node scripts/recovery-fix3-search-test.mjs'
    'typecheck' = 'npm run typecheck'
    'build' = 'npm run build'
  }

  $passed = $false
  for ($attempt = 1; $attempt -le 5; $attempt++) {
    Write-Host "Verification attempt $attempt of 5"
    Assert-LockedContracts
    Assert-AllowedImplementationChanges
    git diff --check
    if ($LASTEXITCODE -ne 0) { throw 'Implementation has diff-check errors.' }

    $results = [ordered]@{}
    foreach ($entry in $checks.GetEnumerator()) {
      $results[$entry.Key] = Invoke-LoggedCommand -Name $entry.Key -Command $entry.Value
    }
    $failed = @($results.GetEnumerator() | Where-Object { [int]$_.Value -ne 0 })
    if ($failed.Count -eq 0) {
      $passed = $true
      break
    }
    if ($attempt -eq 5) { break }

    $failureSummary = foreach ($entry in $failed) {
      $tail = @()
      $tail += @(Get-SafeLogTail -Path (Join-Path $LogDir "$($entry.Key).stdout.log"))
      $tail += @(Get-SafeLogTail -Path (Join-Path $LogDir "$($entry.Key).stderr.log"))
      "### $($entry.Key)`n$($tail -join "`n")"
    }

    $repairPrompt = @(
      'Repair the checked-out Prij Clinic QA implementation so every listed check passes.',
      '',
      'Failed checks and diagnostic tails:',
      ($failureSummary -join "`n`n"),
      '',
      'The locked files scripts/qa-pregnancy-edd-contract-test.mjs and docs/verification/QA_PREGNANCY_EDD_IMPLEMENTATION_SPEC.md must not be edited.',
      'Preserve pregnancy menstrual-context suppression, the pre-pregnancy baseline, pregnancy-specific bleeding fields, EDD candidate preview, explicit clinician confirmation, no-silent-overwrite, correction reason, dating history, Feature 46, and existing regressions.',
      'Do not weaken tests. Do not create migrations, seed/reset/delete data, edit reference/local-reference files, use the network, stage, commit, push, reset, clean, stash, or switch branches.',
      'Keep changes limited to apps/web and packages/shared. Diagnose the root cause and make the narrowest correct repair.'
    ) -join "`n"
    $repairExit = Invoke-Codex -Prompt $repairPrompt -Name "repair-$attempt"
    Write-Host "Codex repair attempt $attempt exit: $repairExit"
  }

  Assert-LockedContracts
  Assert-AllowedImplementationChanges
  if (-not $passed) { throw 'Pregnancy context and EDD package did not pass all checks after five attempts.' }

  $Stage = 'verification report and commit'
  New-Item -ItemType Directory -Force 'docs/verification' | Out-Null
  @(
    '# QA Pregnancy Context and EDD Verification',
    '',
    '- Tickets: `QA-PREG-001`, `QA-EDD-001`',
    '- Pregnancy ordinary menstrual-cycle UI: SUPPRESSED',
    '- Pre-pregnancy menstrual baseline: PRESERVED',
    '- Pregnancy-specific bleeding fields: PASS',
    '- EDD manual mode: PASS',
    '- EDD calculated candidates (LMP, ultrasound, IVF/ET, known conception): PASS',
    '- Clinician confirmation and no-silent-overwrite guard: PASS',
    '- Correction reason and dating history: PASS',
    '- Locked contract test: PASS',
    '- Feature 46 regression: PASS',
    '- Clinical workflow regression: PASS',
    '- Medication regression: PASS',
    '- Search regression: PASS',
    '- Typecheck: PASS',
    '- Production build: PASS',
    '- Migration/seed/reset/delete/truncate: NOT RUN',
    '- Production data modified: NO'
  ) | Set-Content -LiteralPath 'docs/verification/QA_PREGNANCY_EDD_RESULT.md' -Encoding utf8

  $batchPath = 'docs/verification/SPRINT1_QA_REPAIR_BATCH.md'
  $batch = Get-Content -LiteralPath $batchPath -Raw
  if (-not $batch.Contains('QA-PREG-001: VERIFIED')) {
    Add-Content -LiteralPath $batchPath -Value "`n## Verified packages`n`n- QA-PREG-001: VERIFIED`n- QA-EDD-001: VERIFIED`n"
  }

  git config user.name 'github-actions[bot]'
  git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
  git add -- 'apps/web' 'packages/shared' 'docs/verification/QA_PREGNANCY_EDD_RESULT.md' 'docs/verification/SPRINT1_QA_REPAIR_BATCH.md'
  $staged = @(git diff --cached --name-only)
  if ($staged.Count -eq 0) { throw 'No verified implementation changes were staged.' }
  $unsafeStaged = @($staged | Where-Object { $_ -like 'local-reference/*' -or $_ -like 'node_modules/*' -or $_ -like '*.env' -or $_ -like 'apps/api/*' })
  if ($unsafeStaged.Count -gt 0) { throw "Unsafe files staged: $($unsafeStaged -join ', ')" }
  git diff --cached --check
  if ($LASTEXITCODE -ne 0) { throw 'Staged QA implementation has diff-check errors.' }
  git commit -m 'Implement pregnancy context guard and EDD provenance'
  if ($LASTEXITCODE -ne 0) { throw 'Could not commit verified QA Package 1.' }
  git push origin HEAD:work/sprint1-qa-repair-batch
  if ($LASTEXITCODE -ne 0) { throw 'Could not push verified QA Package 1.' }

  $Stage = 'complete'
  Write-Host 'QA-PREG-001 and QA-EDD-001 completed and verified.'
} catch {
  $message = $_.Exception.Message
  Write-Host "QA Pregnancy/EDD controller failed at stage '$Stage': $message"
  Record-Failure -Message $message
  throw
}
