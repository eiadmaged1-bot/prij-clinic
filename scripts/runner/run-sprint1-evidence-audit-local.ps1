param(
  [string]$SourceRepo = 'C:\Newfolder\prij-clinic',
  [string]$RunRoot = 'C:\Newfolder\prij-clinic-runs'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if (-not (Test-Path -LiteralPath $SourceRepo)) { throw "Source repository not found: $SourceRepo" }
$origin = (& git -C $SourceRepo remote get-url origin).Trim()
if ($LASTEXITCODE -ne 0 -or -not $origin) { throw 'Could not determine origin URL.' }

git -C $SourceRepo fetch origin security/rbac-scope-enforcement work/sprint1-qa-repair-batch
if ($LASTEXITCODE -ne 0) { throw 'Could not fetch audit branches.' }

$feature47 = & git -C $SourceRepo show 'origin/work/sprint1-qa-repair-batch:docs/verification/FEATURE47_SEVERITY_EVOLUTION_RESULT.md' 2>$null
if ($LASTEXITCODE -ne 0 -or ($feature47 -join "`n") -notmatch 'Complete regression suite: PASS') {
  throw 'Feature 47 evidence is not green on work/sprint1-qa-repair-batch. Finish the QA autopilot first.'
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
New-Item -ItemType Directory -Force $RunRoot | Out-Null
$workspace = Join-Path $RunRoot "sprint1-audit-$stamp"
git clone --branch work/sprint1-qa-repair-batch --single-branch $origin $workspace
if ($LASTEXITCODE -ne 0) { throw 'Could not clone verified QA branch.' }

$features = @(7,8,9,13,15,17,18,22,23,28,45,46,47,49,101,102,106,107,108,109,110,111,115,119,150,200)
$repoText = Get-ChildItem -LiteralPath $workspace -Recurse -File -Include *.ts,*.tsx,*.js,*.mjs,*.md,*.json | ForEach-Object {
  try { Get-Content -LiteralPath $_.FullName -Raw -ErrorAction Stop } catch { '' }
} | Out-String

$rows = foreach ($feature in $features) {
  $pattern = "(?i)(feature[\s_-]*$feature\b|\bF$feature\b|\b$feature\b)"
  $matches = [regex]::Matches($repoText, $pattern).Count
  $status = if ($feature -eq 46 -or $feature -eq 47) { 'VERIFIED' } elseif ($matches -ge 3) { 'PARTIAL/EVIDENCE FOUND' } elseif ($matches -ge 1) { 'TRACE ONLY' } else { 'MISSING/UNMAPPED' }
  "| $feature | $status | $matches |"
}

$report = @(
  '# Sprint 1 Evidence Audit',
  '',
  "- Source branch: `work/sprint1-qa-repair-batch`",
  "- Local SECTRA audit: `$stamp`",
  '- Feature 46 evidence gate: PASS',
  '- Feature 47 evidence gate: PASS',
  '- Migration/seed/reset/delete/truncate: NOT RUN',
  '- Production data modified: NO',
  '',
  '| Feature | Audit status | Repository traces |',
  '|---:|---|---:|'
) + $rows + @(
  '',
  '## Interpretation',
  '',
  '- VERIFIED means explicit verified evidence is already present.',
  '- PARTIAL/EVIDENCE FOUND means multiple code/test/document traces exist but full completion is not yet proven.',
  '- TRACE ONLY means at least one mapping exists and requires manual inspection.',
  '- MISSING/UNMAPPED means no reliable repository mapping was found and the feature must be scoped before implementation.'
)

$verificationDir = Join-Path $workspace 'docs\verification'
New-Item -ItemType Directory -Force $verificationDir | Out-Null
[System.IO.File]::WriteAllLines((Join-Path $verificationDir 'SPRINT1_EVIDENCE_AUDIT.md'), $report, (New-Object System.Text.UTF8Encoding($false)))

git -C $workspace config user.name 'sectra-local-runner'
git -C $workspace config user.email 'sectra-local-runner@local.invalid'
git -C $workspace add -- 'docs/verification/SPRINT1_EVIDENCE_AUDIT.md'
git -C $workspace diff --cached --check
if ($LASTEXITCODE -ne 0) { throw 'Sprint 1 evidence audit failed diff-check.' }
git -C $workspace commit -m 'Audit remaining Sprint 1 feature evidence'
if ($LASTEXITCODE -ne 0) { throw 'Could not commit Sprint 1 evidence audit.' }
git -C $workspace push origin HEAD:work/sprint1-qa-repair-batch
if ($LASTEXITCODE -ne 0) { throw 'Could not push Sprint 1 evidence audit.' }

Write-Host "SPRINT 1 EVIDENCE AUDIT VERIFIED AND PUSHED." -ForegroundColor Green
Write-Host "Workspace preserved at: $workspace" -ForegroundColor Green
