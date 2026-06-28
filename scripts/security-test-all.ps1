$ErrorActionPreference = "Stop"

$steps = @(
  "smoke:test",
  "test:rbac",
  "test:scope",
  "test:audit",
  "test:ai-safety"
)

foreach ($step in $steps) {
  Write-Host "SECURITY running npm run $step"
  npm run $step
}

Write-Host "SECURITY PASS"
