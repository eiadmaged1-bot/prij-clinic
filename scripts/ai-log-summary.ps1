param(
  [Parameter(Mandatory = $true)]
  [string]$Path,
  [int]$MaxGroups = 25,
  [int]$TailLines = 80
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $Path)) {
  throw "Log file not found: $Path"
}

$lines = Get-Content -LiteralPath $Path
$matches = $lines | Where-Object { $_ -match '(?i)error|failed|exception|TS\d{4}|P\d{4}' }

"=== Root-cause candidates ==="
if (-not $matches) {
  "No matching error lines found."
} else {
  $matches |
    ForEach-Object {
      ($_ -replace '\bline \d+\b', 'line #') -replace ':\d+:\d+', ':#:#'
    } |
    Group-Object |
    Sort-Object Count -Descending |
    Select-Object -First $MaxGroups |
    ForEach-Object { "[{0}x] {1}" -f $_.Count, $_.Name }
}

"`n=== Tail ==="
$lines | Select-Object -Last $TailLines

"`n=== Safety ==="
"Review output before sharing. Never paste secrets, patient data, .env contents, or full database dumps."
