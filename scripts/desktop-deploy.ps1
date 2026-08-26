[CmdletBinding()]
param(
  [ValidateRange(30, 900)]
  [int]$HealthTimeoutSeconds = 240
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$dockerConfig = Join-Path $repo 'demo\docker-public-config'
$demoScript = Join-Path $PSScriptRoot 'demo.ps1'

if (-not (Test-Path -LiteralPath (Join-Path $dockerConfig 'config.json'))) {
  throw "Public Docker config is missing: $dockerConfig"
}

$env:DOCKER_CONFIG = $dockerConfig
& $demoScript Start -ShareTeam

$status = tailscale status --json | ConvertFrom-Json
$dnsName = ([string]$status.Self.DNSName).TrimEnd('.')
if (-not $dnsName) {
  throw 'Tailscale MagicDNS name is unavailable after deployment.'
}

$healthUrl = "http://${dnsName}:8080/healthz"
$deadline = (Get-Date).AddSeconds($HealthTimeoutSeconds)
$lastError = $null
do {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 10
    if ($response.StatusCode -eq 200 -and $response.Content.Trim() -eq 'ok') {
      Write-Host "Desktop demo healthy: http://${dnsName}:8080"
      exit 0
    }
  } catch {
    $lastError = $_.Exception.Message
  }
  Start-Sleep -Seconds 5
} while ((Get-Date) -lt $deadline)

throw "Desktop demo health check timed out at $healthUrl. Last error: $lastError"
