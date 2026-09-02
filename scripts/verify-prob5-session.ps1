[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,

  [ValidateRange(10, 300)]
  [int]$ReadyTimeoutSeconds = 90
)

$ErrorActionPreference = 'Stop'
$normalizedBaseUrl = $BaseUrl.TrimEnd('/')
$deadline = (Get-Date).AddSeconds($ReadyTimeoutSeconds)
$lastError = $null
$ready = $false

do {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $normalizedBaseUrl -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
      $ready = $true
      break
    }
  } catch {
    $lastError = $_.Exception.Message
  }

  Start-Sleep -Seconds 2
} while ((Get-Date) -lt $deadline)

if (-not $ready) {
  throw "Problem 5 did not become ready at $normalizedBaseUrl. Last error: $lastError"
}

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$testId = "session-smoke-$([Guid]::NewGuid().ToString('N'))"
$testPassword = [Guid]::NewGuid().ToString('N')
$payload = @{ id = $testId; pwd = $testPassword } | ConvertTo-Json -Compress

$register = Invoke-WebRequest `
  -UseBasicParsing `
  -Uri "$normalizedBaseUrl/api/auth/register" `
  -Method Post `
  -ContentType 'application/json' `
  -Body $payload `
  -WebSession $session `
  -TimeoutSec 15

if ($register.StatusCode -ne 201) {
  throw "Problem 5 registration returned HTTP $($register.StatusCode), expected 201."
}

$setCookie = [string]$register.Headers['Set-Cookie']
if ($setCookie -match '(?i)(?:^|;\s*)Secure(?:;|$)') {
  throw 'Problem 5 fallback session cookie is still marked Secure on the HTTP demo.'
}

$login = Invoke-WebRequest `
  -UseBasicParsing `
  -Uri "$normalizedBaseUrl/api/auth/login" `
  -Method Post `
  -ContentType 'application/json' `
  -Body $payload `
  -WebSession $session `
  -TimeoutSec 15

if ($login.StatusCode -ne 200) {
  throw "Problem 5 login returned HTTP $($login.StatusCode), expected 200."
}

Write-Host 'Problem 5 HTTP fallback session smoke passed (register 201, login 200, cookie not Secure).'
