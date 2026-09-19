param(
  [string]$InstallRoot = "$env:USERPROFILE\MasterChief",
  [switch]$Launch
)
$ErrorActionPreference = 'Stop'
$repo = Join-Path $InstallRoot 'ComfyUI'
$python = Join-Path $repo '.venv\Scripts\python.exe'
if (-not (Test-Path $python)) { throw "ComfyUI virtual environment was not found at $python." }
$nvidiaSmi = (Get-Command nvidia-smi -ErrorAction SilentlyContinue).Source
if (-not $nvidiaSmi) {
  $candidate = Join-Path $env:ProgramFiles 'NVIDIA Corporation\NVSMI\nvidia-smi.exe'
  if (Test-Path $candidate) { $nvidiaSmi = $candidate }
}
if (-not $nvidiaSmi) { throw 'NVIDIA driver tools were not found. Install or update the NVIDIA Game Ready/Studio driver, reboot, then rerun.' }

$gpu = (& $nvidiaSmi --query-gpu=name,driver_version,memory.total --format=csv,noheader,nounits | Select-Object -First 1).Split(',').Trim()
if ($gpu.Count -lt 3) { throw 'Could not read NVIDIA GPU inventory.' }
$gpuName = $gpu[0]
$driverVersion = [version]$gpu[1]
$vramMb = [int]$gpu[2]
Write-Host "Detected GPU: $gpuName | Driver: $driverVersion | VRAM: $vramMb MB"

$cudaChannel = 'cu126'
if ($driverVersion -ge [version]'580.88') { $cudaChannel = 'cu130' }
if ($gpuName -match 'RTX\s*50' -and $cudaChannel -ne 'cu130') {
  throw 'RTX 50-series requires a current NVIDIA driver for the CUDA 13.0 PyTorch build. Update the NVIDIA driver to 580.88 or newer, reboot, then rerun.'
}

Write-Host "Replacing CPU-only Torch with the official PyTorch 2.13.0 $cudaChannel build."
& $python -m pip uninstall -y torch torchvision torchaudio
& $python -m pip install --no-cache-dir torch==2.13.0 torchvision==0.28.0 --index-url "https://download.pytorch.org/whl/$cudaChannel"
if ($LASTEXITCODE -ne 0) { throw "CUDA PyTorch installation failed (exit $LASTEXITCODE)." }

& $python -c "import json, torch; ok=torch.cuda.is_available(); print(json.dumps({'torch':torch.__version__,'cuda_build':torch.version.cuda,'cuda_available':ok,'gpu':torch.cuda.get_device_name(0) if ok else None,'vram_gb':round(torch.cuda.get_device_properties(0).total_memory/1073741824,1) if ok else None})); raise SystemExit(0 if ok else 3)"
if ($LASTEXITCODE -ne 0) { throw 'PyTorch installed, but CUDA is still unavailable. Update the NVIDIA driver, reboot, and rerun this repair.' }

Write-Host 'CUDA verification passed.'
if ($Launch) { & $python (Join-Path $repo 'main.py') --listen 0.0.0.0 --port 8188 }
