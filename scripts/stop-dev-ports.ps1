$ErrorActionPreference = "Stop"

$ports = @(3000, 3001, 5555)
$currentProcessId = $PID

foreach ($port in $ports) {
  $connections = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
  $processIds = $connections |
    Select-Object -ExpandProperty OwningProcess -Unique |
    Where-Object { $_ -and $_ -ne $currentProcessId }

  foreach ($processId in $processIds) {
    try {
      $process = Get-Process -Id $processId -ErrorAction Stop
      Write-Output "Stopping process $($process.Id) ($($process.ProcessName)) listening on port $port"
      Stop-Process -Id $process.Id -Force -ErrorAction Stop
    } catch {
      Write-Output "Skipped process ${processId} on port ${port}: $($_.Exception.Message)"
    }
  }
}
