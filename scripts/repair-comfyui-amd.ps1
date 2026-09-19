param(
  [string]$InstallRoot = "$env:USERPROFILE\MasterChief",
  [switch]$Launch
)
$ErrorActionPreference = 'Stop'
$repo = Join-Path $InstallRoot 'ComfyUI'
if (-not (Test-Path (Join-Path $repo 'main.py'))) { throw "ComfyUI was not found at $repo." }

$adapter = Get-CimInstance Win32_VideoController | Where-Object { $_.Name -match 'AMD Radeon RX 9060' } | Select-Object -First 1
if (-not $adapter) { throw 'AMD Radeon RX 9060/XT was not detected. This repair is restricted to the verified gfx1200 GPU family.' }
Write-Host "Detected GPU: $($adapter.Name) | Driver: $($adapter.DriverVersion) | ROCm target: gfx1200"

function Install-WingetPackage([string]$Id) {
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { throw 'Windows Package Manager is unavailable. Update App Installer from Microsoft Store, then rerun.' }
  winget install --id $Id --exact --source winget --silent --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) { throw "winget could not install $Id (exit $LASTEXITCODE)." }
}

$python313 = Join-Path $env:LOCALAPPDATA 'Programs\Python\Python313\python.exe'
if (-not (Test-Path $python313)) {
  Write-Host 'Installing 64-bit Python 3.13 required by current AMD ROCm packages.'
  Install-WingetPackage 'Python.Python.3.13'
}
if (-not (Test-Path $python313)) { throw 'Python 3.13 installed but was not located. Open a new Administrator PowerShell and rerun.' }

$venv = Join-Path $repo '.venv'
$backup = Join-Path $repo '.venv-cpu-backup'
if (Test-Path $venv) {
  if (Test-Path $backup) { $backup = Join-Path $repo ('.venv-cpu-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss')) }
  Move-Item $venv $backup
  Write-Host "Prior environment preserved at $backup."
}
& $python313 -m venv $venv
$python = Join-Path $venv 'Scripts\python.exe'
& $python -m pip install --upgrade pip
& $python -m pip install -r (Join-Path $repo 'requirements.txt')
& $python -m pip uninstall -y torch torchvision torchaudio

Write-Host 'Installing official AMD ROCm 10.0 / PyTorch 2.13 packages for gfx1200.'
& $python -m pip install --no-cache-dir --index-url 'https://stable.repo.amd.com/rocm/whl-next/' `
  'torch[device-gfx1200]==2.13.0+rocm10.0.0' `
  'torchvision[device-gfx1200]==0.28.0+rocm10.0.0' `
  'torchaudio==2.11.0.2+rocm10.0.0'
if ($LASTEXITCODE -ne 0) { throw "AMD ROCm PyTorch installation failed (exit $LASTEXITCODE). The prior CPU environment remains at $backup." }

& $python -c "import json, torch; ok=torch.cuda.is_available(); print(json.dumps({'torch':torch.__version__,'hip':torch.version.hip,'accelerator_available':ok,'gpu':torch.cuda.get_device_name(0) if ok else None,'vram_gb':round(torch.cuda.get_device_properties(0).total_memory/1073741824,1) if ok else None})); raise SystemExit(0 if ok else 3)"
if ($LASTEXITCODE -ne 0) { throw 'ROCm packages installed, but the AMD accelerator is unavailable. Update AMD Adrenalin to the current driver, reboot, then rerun.' }

Write-Host 'AMD ROCm verification passed.'
if ($Launch) { & $python (Join-Path $repo 'main.py') --listen 0.0.0.0 --port 8188 }
