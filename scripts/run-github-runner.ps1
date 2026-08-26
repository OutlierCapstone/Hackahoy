[CmdletBinding()]
param(
  [string]$InstallDirectory = 'D:\Services\Hackahoy-actions-runner'
)

$ErrorActionPreference = 'Stop'
$runner = Join-Path $InstallDirectory 'run.cmd'
if (-not (Test-Path -LiteralPath $runner)) {
  throw "GitHub Actions runner is not installed: $runner"
}

Set-Location -LiteralPath $InstallDirectory
& $runner
exit $LASTEXITCODE
