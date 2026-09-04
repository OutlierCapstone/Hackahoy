[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,

  [Parameter(Mandatory = $true)]
  [string]$Origin
)

$ErrorActionPreference = 'Stop'
$normalizedBaseUrl = $BaseUrl.TrimEnd('/')
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$guest = Invoke-RestMethod `
  -Uri "$normalizedBaseUrl/backend/auth/guest" `
  -Method Post `
  -Headers @{ Origin = $Origin } `
  -ContentType 'application/json' `
  -Body '{}' `
  -WebSession $session `
  -TimeoutSec 15

if (-not $guest.success -or [string]::IsNullOrWhiteSpace([string]$guest.data.uid)) {
  throw "Guest issue failed for origin $Origin."
}

try {
  $me = Invoke-RestMethod `
    -Uri "$normalizedBaseUrl/backend/auth/me" `
    -Headers @{ Origin = $Origin } `
    -WebSession $session `
    -TimeoutSec 15

  if ([string]$me.userId -ne [string]$guest.data.uid -or [string]$me.provider -ne 'GUEST') {
    throw "Guest session verification failed for origin $Origin."
  }
} finally {
  Invoke-RestMethod `
    -Uri "$normalizedBaseUrl/backend/auth/unsubscribe" `
    -Method Post `
    -Headers @{ Origin = $Origin } `
    -ContentType 'application/json' `
    -Body '{}' `
    -WebSession $session `
    -TimeoutSec 15 | Out-Null
}

Write-Host "Guest session smoke passed for $Origin (issue, authenticated read, cleanup)."
