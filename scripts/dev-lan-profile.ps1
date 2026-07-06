param(
  [Parameter(Mandatory = $true)]
  [string]$HostIp
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($HostIp) -or $HostIp -notmatch '^\d{1,3}(\.\d{1,3}){3}$') {
  throw "HostIp must be an explicit IPv4 address, for example 100.127.4.46."
}

$octets = $HostIp.Split(".") | ForEach-Object { [int]$_ }
$invalidOctets = @($octets | Where-Object { $_ -lt 0 -or $_ -gt 255 })
if ($invalidOctets.Count -gt 0) {
  throw "HostIp contains an invalid IPv4 octet."
}

$env:APP_ENV = "local"
if (-not $env:NODE_ENV) {
  $env:NODE_ENV = "development"
}
$env:PRIJ_API_INTERNAL_ORIGIN = "http://localhost:3001"
$env:CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000,http://${HostIp}:3000"
$env:API_HOST = "0.0.0.0"
$env:WEB_HOST = "0.0.0.0"
$env:HOST = "0.0.0.0"

Write-Host "Prij Clinic LAN dev profile"
Write-Host "Web: http://${HostIp}:3000"
Write-Host "Browser API path: /api/backend"
Write-Host "Internal API origin: http://localhost:3001"
Write-Host "CORS_ORIGINS: http://localhost:3000,http://127.0.0.1:3000,http://${HostIp}:3000"

npm run dev:start
