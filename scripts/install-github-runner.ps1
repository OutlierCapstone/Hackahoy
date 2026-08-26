[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [string]$RegistrationToken,
  [string]$InstallDirectory = 'D:\Services\Hackahoy-actions-runner'
)

$ErrorActionPreference = 'Stop'
$repoUrl = 'https://github.com/OutlierCapstone/Hackahoy'
$version = '2.336.0'
$archiveName = "actions-runner-win-x64-$version.zip"
$downloadUrl = "https://github.com/actions/runner/releases/download/v$version/$archiveName"
$expectedSha256 = 'D59123A43003E357B0805B5D0F611D0BD2F65AB67D51BD070DD4E7A0F685C162'
$runnerName = 'hackahoy-demo-desktop'
$runnerScript = Join-Path $PSScriptRoot 'run-github-runner.ps1'

if (Test-Path -LiteralPath (Join-Path $InstallDirectory '.runner')) {
  throw "A runner is already configured in $InstallDirectory."
}

New-Item -ItemType Directory -Path $InstallDirectory -Force | Out-Null
$archivePath = Join-Path $InstallDirectory $archiveName
Invoke-WebRequest -Uri $downloadUrl -OutFile $archivePath

$actualSha256 = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToUpperInvariant()
if ($actualSha256 -ne $expectedSha256) {
  throw "Runner package checksum mismatch: $actualSha256"
}

Expand-Archive -LiteralPath $archivePath -DestinationPath $InstallDirectory -Force
Remove-Item -LiteralPath $archivePath

Push-Location -LiteralPath $InstallDirectory
try {
  & .\config.cmd `
    --unattended `
    --url $repoUrl `
    --token $RegistrationToken `
    --name $runnerName `
    --labels 'hackahoy-demo' `
    --work '_work' `
    --replace
  if ($LASTEXITCODE -ne 0) {
    throw "Runner configuration failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}

$arguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$runnerScript`" -InstallDirectory `"$InstallDirectory`""
$action = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument $arguments `
  -WorkingDirectory $InstallDirectory
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$trigger.Delay = 'PT2M'
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName 'HackahoyGitHubRunner' `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description 'Run the Hackahoy GitHub Actions self-hosted deployment runner.' `
  -Force | Out-Null

Start-ScheduledTask -TaskName 'HackahoyGitHubRunner'
Write-Host "Registered and started runner $runnerName."
