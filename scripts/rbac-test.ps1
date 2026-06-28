param(
  [string]$ApiBaseUrl = "http://localhost:3001",
  [string]$Password = $env:DEMO_TEST_PASSWORD
)

$ErrorActionPreference = "Stop"

if (-not $Password) {
  $Password = "LocalDev123!"
}

function Write-Step {
  param([string]$Message)
  Write-Host "RBAC $Message"
}

function Invoke-Json {
  param(
    [string]$Method = "GET",
    [string]$Uri,
    [hashtable]$Headers,
    [object]$Body
  )

  $params = @{ Method = $Method; Uri = $Uri }
  if ($Headers) { $params.Headers = $Headers }
  if ($null -ne $Body) {
    $params.ContentType = "application/json"
    $params.Body = ($Body | ConvertTo-Json -Depth 10)
  }

  Invoke-RestMethod @params
}

function Get-StatusCode {
  param(
    [string]$Method = "GET",
    [string]$Uri,
    [hashtable]$Headers,
    [object]$Body
  )

  try {
    Invoke-Json -Method $Method -Uri $Uri -Headers $Headers -Body $Body | Out-Null
    return 200
  } catch {
    if (-not $_.Exception.Response) { throw }
    return [int]$_.Exception.Response.StatusCode
  }
}

function Assert-Status {
  param(
    [string]$Label,
    [int]$Actual,
    [int[]]$Expected
  )

  if ($Expected -notcontains $Actual) {
    throw "$Label expected status $($Expected -join '/') but received $Actual."
  }
  Write-Step "PASS $Label -> $Actual"
}

function Login {
  param([string]$Email)

  Write-Step "login $Email"
  $login = Invoke-Json -Method Post -Uri "$ApiBaseUrl/auth/login" -Body @{
    email = $Email
    password = $Password
  }

  if (-not $login.token) {
    throw "Login for $Email did not return a token."
  }

  return @{ Authorization = "Bearer $($login.token)" }
}

Write-Step "protected route rejects anonymous request"
Assert-Status "anonymous /patients" (Get-StatusCode -Uri "$ApiBaseUrl/patients") @(401)

$owner = Login "demo.owner@prij.local"
$doctor = Login "demo.doctor@prij.local"
$reception = Login "demo.reception@prij.local"
$accountant = Login "demo.accountant@prij.local"
$nurse = Login "demo.nurse@prij.local"

$today = (Get-Date).ToString("yyyy-MM-dd")
$ownerEndpoints = @(
  "/auth/me",
  "/patients",
  "/appointments",
  "/appointments/calendar?date=$today",
  "/queue/today",
  "/encounters",
  "/prescriptions",
  "/investigations/orders",
  "/reports",
  "/pregnancies",
  "/ob-ultrasounds",
  "/billing/invoices",
  "/dashboard/summary",
  "/ai-drafts",
  "/audit"
)

foreach ($endpoint in $ownerEndpoints) {
  Assert-Status "owner $endpoint" (Get-StatusCode -Uri "$ApiBaseUrl$endpoint" -Headers $owner) @(200)
}

$denials = @(
  @{ Label = "doctor billing denied"; Headers = $doctor; Uri = "/billing/invoices" },
  @{ Label = "reception encounters denied"; Headers = $reception; Uri = "/encounters" },
  @{ Label = "accountant reports denied"; Headers = $accountant; Uri = "/reports" },
  @{ Label = "nurse billing denied"; Headers = $nurse; Uri = "/billing/invoices" },
  @{ Label = "nurse AI drafts denied"; Headers = $nurse; Uri = "/ai-drafts" },
  @{ Label = "reception audit denied"; Headers = $reception; Uri = "/audit" },
  @{ Label = "accountant admin users denied"; Headers = $accountant; Uri = "/admin/users" }
)

foreach ($case in $denials) {
  Assert-Status $case.Label (Get-StatusCode -Uri "$ApiBaseUrl$($case.Uri)" -Headers $case.Headers) @(403)
}

$allows = @(
  @{ Label = "doctor patients allowed"; Headers = $doctor; Uri = "/patients" },
  @{ Label = "reception appointments allowed"; Headers = $reception; Uri = "/appointments" },
  @{ Label = "nurse queue allowed"; Headers = $nurse; Uri = "/queue/today" },
  @{ Label = "accountant invoices allowed"; Headers = $accountant; Uri = "/billing/invoices" }
)

foreach ($case in $allows) {
  Assert-Status $case.Label (Get-StatusCode -Uri "$ApiBaseUrl$($case.Uri)" -Headers $case.Headers) @(200)
}

Write-Host "RBAC PASS"
