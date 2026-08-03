param(
  [string]$ApiBaseUrl = "http://localhost:3001",
  [string]$WebBaseUrl = "http://localhost:3000",
  [string]$Email = $env:DEMO_OWNER_EMAIL,
  [string]$Password = $env:DEMO_OWNER_PASSWORD,
  [switch]$SkipWeb
)

$ErrorActionPreference = "Stop"

if (-not $Email) {
  $Email = "owner@prij.local"
}

if (-not $Password) {
  $Password = "LocalDev123!"
}

function Write-Step {
  param([string]$Message)
  Write-Host "SMOKE $Message"
}

function Invoke-Json {
  param(
    [string]$Method = "GET",
    [string]$Uri,
    [hashtable]$Headers,
    [object]$Body
  )

  $params = @{
    Method = $Method
    Uri = $Uri
  }

  if ($Headers) {
    $params.Headers = $Headers
  }

  if ($null -ne $Body) {
    $params.ContentType = "application/json"
    $params.Body = ($Body | ConvertTo-Json -Depth 10)
  }

  Invoke-RestMethod @params
}

function Assert-Unauthorized {
  param([string]$Uri)

  try {
    Invoke-RestMethod -Method Get -Uri $Uri | Out-Null
    throw "Expected 401 for $Uri but request succeeded."
  } catch {
    $response = $_.Exception.Response
    if (-not $response) {
      throw
    }

    $statusCode = [int]$response.StatusCode
    if ($statusCode -ne 401) {
      throw "Expected 401 for $Uri but received $statusCode."
    }
  }
}

function Assert-WebPage {
  param([string]$Uri)

  $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing
  if ([int]$response.StatusCode -ne 200 -or $response.Content -notmatch "<html") {
    throw "Expected HTML 200 from $Uri."
  }
}

Write-Step "health"
$health = Invoke-Json -Uri "$ApiBaseUrl/health"
if ($health.status -ne "up") {
  throw "GET /health did not return up."
}

Write-Step "health/db"
$healthDb = Invoke-Json -Uri "$ApiBaseUrl/health/db"
if ($healthDb.status -ne "ok" -or $healthDb.database -ne "connected") {
  throw "GET /health/db did not return connected."
}

Write-Step "protected route rejects anonymous request"
Assert-Unauthorized "$ApiBaseUrl/patients"

Write-Step "login"
$login = Invoke-Json -Method Post -Uri "$ApiBaseUrl/auth/login" -Body @{
  email = $Email
  password = $Password
}

if (-not $login.token) {
  throw "Login did not return a token."
}

$headers = @{ Authorization = "Bearer $($login.token)" }

Write-Step "auth/me"
$me = Invoke-Json -Uri "$ApiBaseUrl/auth/me" -Headers $headers
if (-not $me.user -or -not $me.user.permissions) {
  throw "GET /auth/me did not return user permissions."
}

$today = (Get-Date).ToString("yyyy-MM-dd")
$protectedEndpoints = @(
  "/admin/users",
  "/admin/roles",
  "/admin/permissions",
  "/audit",
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
  "/billing/payments",
  "/dashboard/summary",
  "/ai-drafts"
)

foreach ($endpoint in $protectedEndpoints) {
  Write-Step $endpoint
  Invoke-Json -Uri "$ApiBaseUrl$endpoint" -Headers $headers | Out-Null
}

Write-Step "AI draft safety metadata"
$aiDrafts = Invoke-Json -Uri "$ApiBaseUrl/ai-drafts" -Headers $headers
$firstDraft = @($aiDrafts.aiDrafts | Select-Object -First 1)
if ($firstDraft) {
  if ($firstDraft.modelProvider -ne "disabled_mock" -or $firstDraft.modelName -ne "no_external_ai") {
    throw "AI draft is not marked disabled/mock-only."
  }
}

if (-not $SkipWeb) {
  foreach ($page in @(
    "/",
    "/login",
    "/dashboard",
    "/patients",
    "/appointments",
    "/queue",
    "/encounters",
    "/reports",
    "/pregnancies",
    "/ultrasound",
    "/billing",
    "/ai-drafts"
  )) {
    Write-Step "web $page"
    Assert-WebPage "$WebBaseUrl$page"
  }
}

Write-Host "SMOKE PASS"
