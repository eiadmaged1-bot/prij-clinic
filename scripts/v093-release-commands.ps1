param(
  [switch]$RequireAllChecksPassed
)

Write-Host ""
Write-Host "v0.9.3 release command helper"
Write-Host "This helper does not run automatically from tests."
Write-Host ""

if (-not $RequireAllChecksPassed) {
  Write-Host "Release tag is forbidden until all checks pass without V093_ALLOW_ENV_SKIP."
  Write-Host "First run:"
  Write-Host "  npm run test:v093:release"
  Write-Host ""
  Write-Host "After every check passes, rerun this helper with:"
  Write-Host "  powershell -ExecutionPolicy Bypass -File scripts/v093-release-commands.ps1 -RequireAllChecksPassed"
  exit 0
}

Write-Host "Run these commands only after all final checks passed without V093_ALLOW_ENV_SKIP:"
Write-Host ""
Write-Host "git status"
Write-Host "git add ."
Write-Host "git restore --staged .env apps/api/.env .env.staging .env.production apps/web/tsconfig.tsbuildinfo 2>`$null"
Write-Host "git restore --staged storage uploads apps/api/storage apps/api/uploads 2>`$null"
Write-Host "git commit -m `"Add v0.9.3 automated QA stabilization`""
Write-Host "git tag v0.9.3-automated-qa-stabilization"
Write-Host "git push -u origin hardening/v0.9.3-automated-qa-stabilization"
Write-Host "git push origin --tags"
