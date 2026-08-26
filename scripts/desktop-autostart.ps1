[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$logPath = Join-Path (Split-Path -Parent $repo) 'hackahoy-demo-task.log'
$dockerBin = 'C:\Program Files\Docker\Docker\resources\bin'
$tailscaleBin = 'C:\Program Files\Tailscale'

$env:Path = "$dockerBin;$tailscaleBin;$env:Path"

Start-Transcript -LiteralPath $logPath -Force | Out-Null
try {
  & (Join-Path $PSScriptRoot 'demo.ps1') Start -ShareTeam -NoBuild
  if ($LASTEXITCODE -ne 0) {
    throw "Hackahoy demo start failed with exit code $LASTEXITCODE."
  }
} catch {
  Write-Error $_
  exit 1
} finally {
  Stop-Transcript | Out-Null
}

exit 0
