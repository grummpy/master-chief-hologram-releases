param(
  [string]$InstallRoot = "$env:USERPROFILE\MasterChief",
  [string]$ControllerIp = "192.168.4.42",
  [switch]$Launch
)
$ErrorActionPreference = 'Stop'
$repo = Join-Path $InstallRoot 'ComfyUI'
New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null

function Install-WingetPackage([string]$Id) {
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "Windows Package Manager is required to install $Id automatically. Update App Installer from Microsoft Store, then rerun."
  }
  Write-Host "Installing prerequisite: $Id"
  winget install --id $Id --exact --source winget --silent --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) { throw "winget could not install $Id (exit $LASTEXITCODE)." }
}

$git = (Get-Command git -ErrorAction SilentlyContinue).Source
if (-not $git) {
  Install-WingetPackage 'Git.Git'
  $gitCandidate = Join-Path $env:ProgramFiles 'Git\cmd\git.exe'
  if (Test-Path $gitCandidate) { $git = $gitCandidate }
}
if (-not $git) { throw 'Git installation completed but git.exe could not be located. Open a new Administrator PowerShell and rerun.' }

$python = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $python -or $python -like '*WindowsApps*') {
  Install-WingetPackage 'Python.Python.3.12'
  $pythonCandidate = Join-Path $env:LOCALAPPDATA 'Programs\Python\Python312\python.exe'
  if (Test-Path $pythonCandidate) { $python = $pythonCandidate }
}
if (-not $python -or -not (Test-Path $python)) { throw 'Python installation completed but python.exe could not be located. Open a new Administrator PowerShell and rerun.' }

if (-not (Test-Path $repo)) { & $git clone --filter=blob:none https://github.com/Comfy-Org/ComfyUI.git $repo }
if ($LASTEXITCODE -ne 0) { throw 'ComfyUI repository download failed.' }
& $python -m venv (Join-Path $repo '.venv')
$python = Join-Path $repo '.venv\Scripts\python.exe'
& $python -m pip install --upgrade pip
& $python -m pip install -r (Join-Path $repo 'requirements.txt')
Write-Host "ComfyUI installed at $repo. No model weights were downloaded."
Write-Host 'Install the GPU-specific PyTorch repair from the same trusted transfer source before first launch (AMD or NVIDIA).'
try {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  if ($principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Get-NetFirewallRule -DisplayName 'Master Chief ComfyUI' -ErrorAction SilentlyContinue | Remove-NetFirewallRule
    New-NetFirewallRule -DisplayName 'Master Chief ComfyUI' -Direction Inbound -Protocol TCP -LocalPort 8188 -RemoteAddress $ControllerIp -Action Allow | Out-Null
    Write-Host "Windows Firewall allows port 8188 only from $ControllerIp."
  } else {
    Write-Warning 'Run PowerShell as Administrator once to create the controller-scoped Windows Firewall rule.'
  }
} catch { Write-Warning "Firewall rule was not changed: $($_.Exception.Message)" }
$addresses = Get-NetIPAddress -AddressFamily IPv4 -AddressState Preferred -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' -or $_.IPAddress -match '^172\.(1[6-9]|2[0-9]|3[01])\.' } |
  Select-Object -ExpandProperty IPAddress
Write-Host "Windows private IP address(es): $($addresses -join ', ')"
if ($Launch) { & $python (Join-Path $repo 'main.py') --listen 0.0.0.0 --port 8188 }
