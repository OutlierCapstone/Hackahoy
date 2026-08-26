[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$autostartScript = Join-Path $PSScriptRoot 'desktop-autostart.ps1'

$arguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$autostartScript`""
$action = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument $arguments `
  -WorkingDirectory $repo
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$trigger.Delay = 'PT1M'
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName 'HackahoyDemo' `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description 'Start the Hackahoy Tailscale demo after desktop sign-in.' `
  -Force | Out-Null

Write-Host "Registered HackahoyDemo for $env:USERNAME."
