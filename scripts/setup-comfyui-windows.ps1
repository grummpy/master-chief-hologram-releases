param(
  [string]$InstallRoot = "$env:USERPROFILE\MasterChief",
  [switch]$Launch
)
$ErrorActionPreference = 'Stop'
$repo = Join-Path $InstallRoot 'ComfyUI'
New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git is required. Install Git for Windows, then rerun.' }
if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw 'Python 3.12 or 3.13 is required. Install it, then rerun.' }
if (-not (Test-Path $repo)) { git clone --filter=blob:none https://github.com/Comfy-Org/ComfyUI.git $repo }
python -m venv (Join-Path $repo '.venv')
$python = Join-Path $repo '.venv\Scripts\python.exe'
& $python -m pip install --upgrade pip
& $python -m pip install -r (Join-Path $repo 'requirements.txt')
Write-Host "ComfyUI installed at $repo. No model weights were downloaded."
Write-Host 'Before LAN use, reserve the Windows IP and restrict port 8188 to the controller IP in Windows Firewall.'
if ($Launch) { & $python (Join-Path $repo 'main.py') --listen 0.0.0.0 --port 8188 }
