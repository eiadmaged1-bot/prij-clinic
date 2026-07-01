$ErrorActionPreference = "Stop"

function Section {
  param([string]$Title)
  Write-Host ""
  Write-Host "=== v0.9.3 $Title ==="
}

function Run-Step {
  param(
    [string]$Title,
    [scriptblock]$Command
  )
  Section $Title
  & $Command
}

function Run-Npm-IfPresent {
  param(
    [string]$ScriptName,
    [string]$Label = $ScriptName
  )
  $package = Get-Content -Raw package.json | ConvertFrom-Json
  if ($package.scripts.PSObject.Properties.Name -contains $ScriptName) {
    Run-Step $Label { npm run $ScriptName }
  } else {
    Write-Host "SKIP missing package script: $ScriptName"
  }
}

Section "Final Release Validation"
Write-Host "This runner validates only. It does not reset the database, run docker compose down -v, commit, tag, or push."
Write-Host "Do not create the v0.9.3 release tag unless every check below passes without V093_ALLOW_ENV_SKIP."

Run-Step "git status" { git status --short }
Run-Step "start postgres" { docker compose up -d postgres }
Run-Step "Prisma repair" { npm run prisma:repair }
Run-Step "Prisma seed" { npm run prisma:seed }
Run-Step "typecheck" { npm run typecheck }
Run-Step "build" { npm run build }
Run-Step "v0.9.3 route QA" { npm run test:v093:routes }
Run-Step "v0.9.3 UI text sweep" { npm run test:v093:ui-text }
Run-Step "v0.9.3 medication UI" { npm run test:v093:medication-ui }
Run-Step "v0.9.3 patient create" { npm run test:v093:patient-create }
Run-Step "v0.9.3 role visibility" { npm run test:v093:roles }

foreach ($script in @(
  "smoke:test",
  "test:security",
  "test:security:ci",
  "test:security:expanded",
  "test:theme:ui",
  "test:theme:prij-heritage",
  "test:doctor:ux",
  "test:visual:qa",
  "test:e2e:v01",
  "test:clinical:persistence",
  "test:gyn:starter",
  "test:obgyn:core",
  "test:accounts:rbac",
  "test:ai:regression",
  "test:ai-management",
  "test:staging:smoke",
  "test:medications",
  "test:drug-market",
  "test:medication-intelligence",
  "test:medication-ui-clean",
  "test:drug-market:review",
  "test:drug-market:oman",
  "test:drug-market:verification",
  "test:drug-market:source-recovery"
)) {
  Run-Npm-IfPresent $script $script
}

Section "Complete"
Write-Host "All configured v0.9.3 final release checks passed. Commit/tag/push are still manual and must be done separately."
