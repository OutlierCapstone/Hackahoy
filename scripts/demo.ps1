[CmdletBinding()]
param(
  [ValidateSet('Start', 'Stop', 'Status')]
  [string]$Action = 'Start',
  [switch]$ShareTeam,
  [switch]$NoBuild
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$compose = Join-Path $repo 'compose.demo.yml'

if ($Action -eq 'Stop') {
  docker compose -f $compose down
  Write-Host 'Hackahoy demo stopped. The PostgreSQL demo volume was preserved.'
  exit 0
}

if ($Action -eq 'Status') {
  docker compose -f $compose ps
  exit 0
}

$env:DEMO_BIND_ADDRESS = '127.0.0.1'
$env:DEMO_ORIGIN = 'http://localhost:8080'
$env:DEMO_COOKIE_SECURE = 'false'
$env:DEMO_CHALLENGE_SCHEME = 'http'
$mainUrl = $env:DEMO_ORIGIN
$challengeHost = 'localhost'
$challengeScheme = 'http'

if ($ShareTeam) {
  $tailscale = Get-Command tailscale -ErrorAction SilentlyContinue
  if (-not $tailscale) {
    throw 'Tailscale is not installed. Install/sign in first, or run without -ShareTeam.'
  }

  $status = tailscale status --json | ConvertFrom-Json
  $dnsName = [string]$status.Self.DNSName
  $dnsName = $dnsName.TrimEnd('.')
  if (-not $dnsName) {
    throw 'Tailscale is not connected or MagicDNS is unavailable.'
  }

  $tailnetIp = [string](tailscale ip -4 | Select-Object -First 1)
  $tailnetIp = $tailnetIp.Trim()
  if (-not $tailnetIp) {
    throw 'Tailscale has no IPv4 address.'
  }

  $env:DEMO_BIND_ADDRESS = $tailnetIp
  $env:DEMO_ORIGIN = "http://${dnsName}:8080"
  $env:DEMO_COOKIE_SECURE = 'false'
  $env:DEMO_CHALLENGE_SCHEME = 'http'
  $mainUrl = $env:DEMO_ORIGIN
  $challengeHost = $dnsName
  $challengeScheme = 'http'
}

if ($NoBuild) {
  docker compose -f $compose up -d --no-build
} else {
  docker compose -f $compose up -d --build
}
if ($LASTEXITCODE -ne 0) {
  throw "Docker Compose failed with exit code $LASTEXITCODE."
}

Write-Host "Main demo: $mainUrl"
Write-Host 'Challenge URLs:'
1..7 | ForEach-Object { Write-Host "  ${challengeScheme}://${challengeHost}:$($_ + 5000)" }
Write-Host 'Only share these URLs with trusted team members. The challenge services are intentionally vulnerable.'
