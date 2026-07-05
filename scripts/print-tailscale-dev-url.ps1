Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$tailscale = Get-Command tailscale -ErrorAction SilentlyContinue
if (-not $tailscale) {
  Write-Host "tailscale command was not found on this computer."
  Write-Host "Install Tailscale, sign in, and connect this computer to your tailnet before using mobile dev access."
  exit 1
}

$ip = (& tailscale ip -4 | Select-Object -First 1).Trim()
if (-not $ip) {
  Write-Host "No Tailscale IPv4 address was returned."
  Write-Host "Confirm Tailscale is running and this computer is connected to the tailnet."
  exit 1
}

Write-Host "Tailscale IPv4: $ip"
Write-Host "Mobile web URL: http://${ip}:3000"
Write-Host "API health URL: http://${ip}:3001/health"
Write-Host "Start with: npm run dev:tailscale"
Write-Host "Keep the phone connected to the same Tailscale account/tailnet. Do not use Tailscale Funnel or public internet exposure."
