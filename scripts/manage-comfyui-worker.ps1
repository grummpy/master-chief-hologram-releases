param(
  [ValidateSet('Install', 'Start', 'Stop', 'Restart', 'Status', 'Uninstall')]
  [string]$Action = 'Install',
  [string]$InstallRoot = "$env:USERPROFILE\MasterChief",
  [int]$Port = 8188
)

$ErrorActionPreference = 'Stop'
$taskName = 'Master Chief ComfyUI Worker'
$repo = Join-Path $InstallRoot 'ComfyUI'
$python = Join-Path $repo '.venv\Scripts\python.exe'
$main = Join-Path $repo 'main.py'
$serviceRoot = Join-Path $InstallRoot 'service'
$runner = Join-Path $serviceRoot 'run-comfyui-worker.ps1'
$cmdRunner = Join-Path $serviceRoot 'run-comfyui-worker.cmd'
$vbsRunner = Join-Path $serviceRoot 'run-comfyui-worker.vbs'
$logRoot = Join-Path $InstallRoot 'logs'
$stdoutLog = Join-Path $logRoot 'comfyui-worker.log'
$stderrLog = Join-Path $logRoot 'comfyui-worker-error.log'
$healthUrl = "http://127.0.0.1:$Port/system_stats"

function Assert-WorkerFiles {
  if (-not (Test-Path $main)) { throw "ComfyUI was not found at $repo." }
  if (-not (Test-Path $python)) { throw "ComfyUI Python environment was not found at $python." }
}

function Get-WorkerProcesses {
  Get-CimInstance Win32_Process -Filter "Name = 'python.exe' OR Name = 'pythonw.exe'" -ErrorAction SilentlyContinue |
    Where-Object {
      $_.ExecutablePath -eq $python -and
      $_.CommandLine -match [regex]::Escape($main)
    }
}

function Test-WorkerHealth {
  try {
    $null = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 3
    return $true
  } catch {
    return $false
  }
}

function Write-Status {
  $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  $taskInfo = if ($task) { Get-ScheduledTaskInfo -TaskName $taskName -ErrorAction SilentlyContinue } else { $null }
  $processes = @(Get-WorkerProcesses)
  $healthy = Test-WorkerHealth
  [pscustomobject]@{
    TaskInstalled = [bool]$task
    TaskState = if ($task) { [string]$task.State } else { 'Not installed' }
    LastTaskResult = if ($taskInfo) { $taskInfo.LastTaskResult } else { $null }
    LastRunTime = if ($taskInfo) { $taskInfo.LastRunTime } else { $null }
    ProcessIds = ($processes.ProcessId -join ', ')
    ApiHealthy = $healthy
    HealthUrl = $healthUrl
    Log = $stdoutLog
    ErrorLog = $stderrLog
  } | Format-List
}

function Wait-WorkerHealth([int]$TimeoutSeconds = 60) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    if (Test-WorkerHealth) { return $true }
    Start-Sleep -Seconds 2
  } while ((Get-Date) -lt $deadline)
  return $false
}

function Stop-Worker {
  $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if ($task -and $task.State -eq 'Running') {
    Stop-ScheduledTask -TaskName $taskName
    Start-Sleep -Seconds 2
  }
  foreach ($process in @(Get-WorkerProcesses)) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }
}

switch ($Action) {
  'Install' {
    Assert-WorkerFiles
    New-Item -ItemType Directory -Force -Path $serviceRoot, $logRoot | Out-Null
    # ComfyUI writes to console streams during startup, so pythonw is not safe.
    # Task Scheduler already runs this action without an interactive console;
    # invoke cmd explicitly so Windows does not depend on .cmd file association.
    $cmdContent = @"
@echo off
cd /d "$repo"
"$python" "$main" --listen 0.0.0.0 --port $Port 1>>"$stdoutLog" 2>>"$stderrLog"
exit /b %ERRORLEVEL%
"@
    Set-Content -LiteralPath $cmdRunner -Value $cmdContent -Encoding ASCII
    # GPU runtimes need the signed-in desktop user's graphics session. A hidden
    # logon task starts without an open PowerShell window while retaining AMD
    # driver access; SYSTEM tasks can exit cleanly without ever exposing a GPU.
    $taskAction = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/d /c `"`"$cmdRunner`"`""
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    $trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
    $trigger.Delay = 'PT30S'
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1)
    $principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Limited
    Register-ScheduledTask -TaskName $taskName -Action $taskAction -Trigger $trigger -Settings $settings -Principal $principal -Description 'Runs the private Master Chief ComfyUI GPU worker invisibly after the Windows user signs in.' -Force | Out-Null
    Write-Host "Installed background task: $taskName"
    Write-Host 'It will start automatically about 30 seconds after Windows sign-in without an open PowerShell window.'
    if (Test-WorkerHealth) {
      Write-Warning "Port $Port is already serving ComfyUI. Close the old foreground ComfyUI window, then run this script with -Action Restart."
    } else {
      Start-ScheduledTask -TaskName $taskName
      if (-not (Wait-WorkerHealth 60)) { Write-Warning 'The worker did not become healthy within 60 seconds. Review LastTaskResult below.' }
    }
    Write-Status
  }
  'Start' {
    if (-not (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue)) { throw 'Background task is not installed. Run with -Action Install first.' }
    Start-ScheduledTask -TaskName $taskName
    if (-not (Wait-WorkerHealth 60)) { Write-Warning 'The worker did not become healthy within 60 seconds. Review LastTaskResult below.' }
    Write-Status
  }
  'Stop' {
    Stop-Worker
    Write-Status
  }
  'Restart' {
    Stop-Worker
    Start-ScheduledTask -TaskName $taskName
    if (-not (Wait-WorkerHealth 60)) { Write-Warning 'The worker did not become healthy within 60 seconds. Review LastTaskResult below.' }
    Write-Status
  }
  'Status' {
    Write-Status
  }
  'Uninstall' {
    Stop-Worker
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $runner -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $cmdRunner -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $vbsRunner -Force -ErrorAction SilentlyContinue
    Write-Host "Removed background task: $taskName"
    Write-Host "Logs were preserved at $logRoot."
  }
}
