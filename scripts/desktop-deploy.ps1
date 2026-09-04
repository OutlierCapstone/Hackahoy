[CmdletBinding()]
param(
  [ValidateRange(30, 900)]
  [int]$HealthTimeoutSeconds = 240,
  [switch]$NoBuild
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$dockerConfig = Join-Path $repo 'demo\docker-public-config'
$demoScript = Join-Path $PSScriptRoot 'demo.ps1'
$secretDirectory = Join-Path $env:LOCALAPPDATA 'Hackahoy\secrets'
$geminiSecretFile = Join-Path $secretDirectory 'gemini-api-key.dpapi'
$prob7FlagSecretFile = Join-Path $secretDirectory 'prob7-flag.dpapi'

if (-not (Test-Path -LiteralPath (Join-Path $dockerConfig 'config.json'))) {
  throw "Public Docker config is missing: $dockerConfig"
}

# GitHub Actions supplies the repository secret on deployments. Persist only a
# Windows DPAPI-encrypted copy so the same signed-in account can restore the
# demo after a reboot without keeping a plaintext API key in either checkout.
if (-not [string]::IsNullOrWhiteSpace($env:GEMINI_API_KEY)) {
  New-Item -ItemType Directory -Path $secretDirectory -Force | Out-Null
  $secureKey = ConvertTo-SecureString -String $env:GEMINI_API_KEY -AsPlainText -Force
  $secureKey | ConvertFrom-SecureString | Set-Content -LiteralPath $geminiSecretFile -Encoding utf8 -NoNewline
} elseif (Test-Path -LiteralPath $geminiSecretFile) {
  # Set-Content from older deployments may have left a trailing newline. The
  # DPAPI payload is hexadecimal, so trim transport whitespace before parsing.
  $encryptedKey = (Get-Content -LiteralPath $geminiSecretFile -Raw).Trim()
  $secureKey = $encryptedKey | ConvertTo-SecureString
  $keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
  try {
    $env:GEMINI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
  }
} else {
  throw 'GEMINI_API_KEY is unavailable. Run the GitHub deploy workflow once to provision the encrypted desktop copy.'
}

# Problem 7's flag must never live in the repository or Compose file. Persist a
# per-user DPAPI copy so scheduled restarts can restore it without plaintext.
if (-not [string]::IsNullOrWhiteSpace($env:PROB7_FLAG)) {
  New-Item -ItemType Directory -Path $secretDirectory -Force | Out-Null
  $secureProb7Flag = ConvertTo-SecureString -String $env:PROB7_FLAG -AsPlainText -Force
  $secureProb7Flag | ConvertFrom-SecureString | Set-Content -LiteralPath $prob7FlagSecretFile -Encoding utf8 -NoNewline
} elseif (Test-Path -LiteralPath $prob7FlagSecretFile) {
  $encryptedProb7Flag = (Get-Content -LiteralPath $prob7FlagSecretFile -Raw).Trim()
  $secureProb7Flag = $encryptedProb7Flag | ConvertTo-SecureString
  $flagPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureProb7Flag)
  try {
    $env:PROB7_FLAG = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($flagPointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($flagPointer)
  }
} else {
  throw 'PROB7_FLAG is unavailable. Provision the encrypted desktop copy before deploying problem 7.'
}

$env:DOCKER_CONFIG = $dockerConfig
$env:COMPOSE_BAKE = 'false'
$env:COMPOSE_PARALLEL_LIMIT = '1'
if ($NoBuild) {
  & $demoScript Start -ShareTeam -NoBuild
} else {
  & $demoScript Start -ShareTeam
}

$status = tailscale status --json | ConvertFrom-Json
$dnsName = ([string]$status.Self.DNSName).TrimEnd('.')
if (-not $dnsName) {
  throw 'Tailscale MagicDNS name is unavailable after deployment.'
}

$tailnetIp = [string](tailscale ip -4 | Select-Object -First 1)
$tailnetIp = $tailnetIp.Trim()
if (-not $tailnetIp) {
  throw 'Tailscale IPv4 address is unavailable after deployment.'
}

$healthUrl = "http://${dnsName}:8080/healthz"
$deadline = (Get-Date).AddSeconds($HealthTimeoutSeconds)
$lastError = $null
$healthy = $false
do {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 10
    if ($response.StatusCode -eq 200 -and $response.Content.Trim() -eq 'ok') {
      $healthy = $true
      break
    }
  } catch {
    $lastError = $_.Exception.Message
  }
  Start-Sleep -Seconds 5
} while ((Get-Date) -lt $deadline)

if (-not $healthy) {
  throw "Desktop demo health check timed out at $healthUrl. Last error: $lastError"
}

foreach ($problemNumber in 1..7) {
  $challengeUrl = "http://${dnsName}:$($problemNumber + 5000)/"
  $challengeResponse = Invoke-WebRequest -UseBasicParsing -Uri $challengeUrl -TimeoutSec 10
  if ($challengeResponse.StatusCode -ne 200) {
    throw "Challenge $problemNumber health check failed at $challengeUrl with HTTP $($challengeResponse.StatusCode)."
  }
}

& (Join-Path $PSScriptRoot 'verify-prob5-session.ps1') `
  -BaseUrl "http://${dnsName}:5005"
& (Join-Path $PSScriptRoot 'verify-guest-session.ps1') `
  -BaseUrl "http://${dnsName}:8080" `
  -Origin "http://${dnsName}:8080"
& (Join-Path $PSScriptRoot 'verify-guest-session.ps1') `
  -BaseUrl "http://${tailnetIp}:8080" `
  -Origin "http://${tailnetIp}:8080"
Write-Host "Desktop demo healthy: http://${dnsName}:8080"
