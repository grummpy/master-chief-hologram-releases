param(
  [ValidateSet('Preflight', 'Core', 'Image', 'VideoPilot', 'ClusterPilot', 'All')]
  [string]$Gate = 'All',
  [string]$InstallRoot = "$env:USERPROFILE\MasterChief",
  [int]$ComfyPort = 8188
)

$ErrorActionPreference = 'Stop'
$reportRoot = Join-Path $InstallRoot 'reports'
New-Item -ItemType Directory -Force -Path $reportRoot | Out-Null
$results = [System.Collections.Generic.List[object]]::new()

function Add-Check([string]$gate, [string]$name, [bool]$passed, [string]$evidence, [bool]$required = $true) {
  $results.Add([pscustomobject]@{ gate = $gate; check = $name; passed = $passed; required = $required; evidence = $evidence })
}

function Test-Command([string]$name) { return [bool](Get-Command $name -ErrorAction SilentlyContinue) }
function Test-JsonEndpoint([string]$url) {
  try { return Invoke-RestMethod -Uri $url -TimeoutSec 8 } catch { return $null }
}

$os = Get-CimInstance Win32_OperatingSystem
$computer = Get-CimInstance Win32_ComputerSystem
$gpus = @(Get-CimInstance Win32_VideoController | Select-Object Name, DriverVersion, AdapterRAM)
$drive = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
$freeGb = [math]::Round($drive.FreeSpace / 1GB, 1)
$ramGb = [math]::Round($computer.TotalPhysicalMemory / 1GB, 1)
$comfyRoot = Join-Path $InstallRoot 'ComfyUI'
$comfyHealth = Test-JsonEndpoint "http://127.0.0.1:$ComfyPort/system_stats"
$checkpoints = Test-JsonEndpoint "http://127.0.0.1:$ComfyPort/models/checkpoints"

if ($Gate -in @('Preflight', 'All')) {
  Add-Check 'Preflight' '64-bit Windows' ($os.OSArchitecture -match '64') "$($os.Caption) $($os.OSArchitecture)"
  Add-Check 'Preflight' 'System memory >= 16 GB' ($ramGb -ge 15) "$ramGb GB"
  Add-Check 'Preflight' 'Free disk >= 50 GB' ($freeGb -ge 50) "$freeGb GB free on C:"
  Add-Check 'Preflight' 'AMD discrete GPU detected' ([bool]($gpus.Name -match 'AMD Radeon RX')) (($gpus | ForEach-Object { "$($_.Name) driver $($_.DriverVersion)" }) -join '; ')
  Add-Check 'Preflight' 'Git available' (Test-Command 'git') ((Get-Command git -ErrorAction SilentlyContinue).Source)
  Add-Check 'Preflight' 'PowerShell 5.1+' ($PSVersionTable.PSVersion.Major -ge 5) "$($PSVersionTable.PSVersion)"
}

if ($Gate -in @('Core', 'All')) {
  Add-Check 'Core' 'ComfyUI installation exists' (Test-Path (Join-Path $comfyRoot 'main.py')) $comfyRoot
  Add-Check 'Core' 'ComfyUI API healthy' ($null -ne $comfyHealth) "http://127.0.0.1:$ComfyPort/system_stats"
  $task = Get-ScheduledTask -TaskName 'Master Chief ComfyUI Worker' -ErrorAction SilentlyContinue
  Add-Check 'Core' 'Boot worker task installed' ($null -ne $task) ($(if ($task) { "$($task.TaskName): $($task.State)" } else { 'not installed' }))
  $sshd = Get-Service sshd -ErrorAction SilentlyContinue
  Add-Check 'Core' 'Remote maintenance service automatic' ($sshd -and $sshd.StartType -eq 'Automatic') ($(if ($sshd) { "$($sshd.Status), $($sshd.StartType)" } else { 'not installed' }))
}

if ($Gate -in @('Image', 'All')) {
  $names = @($checkpoints | ForEach-Object { [string]$_ })
  Add-Check 'Image' 'At least one checkpoint available' ($names.Count -gt 0) ($names -join '; ')
  Add-Check 'Image' 'Quality SDXL checkpoint available' ([bool]($names -match 'Juggernaut.*XL|sd_xl')) ($names -join '; ')
  Add-Check 'Image' 'Image API ready' ($null -ne $comfyHealth -and $names.Count -gt 0) 'Requires healthy API plus a checkpoint.'
}

if ($Gate -in @('VideoPilot', 'All')) {
  Add-Check 'VideoPilot' 'Capacity reserve >= 100 GB' ($freeGb -ge 100) "$freeGb GB free" $true
  Add-Check 'VideoPilot' 'ComfyUI API healthy' ($null -ne $comfyHealth) "http://127.0.0.1:$ComfyPort/system_stats" $true
  Add-Check 'VideoPilot' 'Pilot remains opt-in' $false 'No video model is promoted until an AMD-Windows workflow, license, checksum, VRAM test, and rollback pass.' $true
}

if ($Gate -in @('ClusterPilot', 'All')) {
  Add-Check 'ClusterPilot' 'EXO is not a Windows-worker dependency' $true 'Pilot EXO separately on Apple-silicon Macs; keep Windows ComfyUI independent.'
  Add-Check 'ClusterPilot' 'Cluster benchmark approved' $false 'Requires inventory of both iMacs and Mac mini, wired topology, privacy boundary, and single-node baseline.' $true
}

$requiredFailures = @($results | Where-Object { $_.required -and -not $_.passed })
$report = [pscustomobject]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  computer = $env:COMPUTERNAME
  requestedGate = $Gate
  outcome = if ($requiredFailures.Count) { 'HOLD' } else { 'PASS' }
  results = $results
}
$reportPath = Join-Path $reportRoot "readiness-$($Gate.ToLowerInvariant()).json"
$report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $reportPath -Encoding UTF8
$results | Format-Table gate, passed, required, check, evidence -AutoSize -Wrap
Write-Host "Gate outcome: $($report.outcome)"
Write-Host "Evidence: $reportPath"
if ($requiredFailures.Count) { exit 2 }

