param(
  [switch]$RemoveVolumes
)

$ErrorActionPreference = "Stop"

if ($RemoveVolumes) {
  throw "Refusing to remove staging volumes. Use non-destructive stop only for this sprint."
}

docker compose -f docker-compose.staging.yml stop
Write-Host "Staging stack stopped without deleting volumes."
