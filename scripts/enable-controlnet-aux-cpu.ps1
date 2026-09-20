param(
  [ValidateSet('Enable', 'Disable', 'Status')]
  [string]$Action = 'Status'
)

$ErrorActionPreference = 'Stop'
$root = Join-Path $env:USERPROFILE 'MasterChief\ComfyUI'
$python = Join-Path $root '.venv\Scripts\python.exe'
$disabled = Join-Path $root 'custom_nodes\comfyui_controlnet_aux.disabled'
$enabled = Join-Path $root 'custom_nodes\comfyui_controlnet_aux'
$manager = Join-Path $env:USERPROFILE 'Downloads\manage-comfyui-worker.ps1'
$evidence = Join-Path $env:USERPROFILE 'MasterChief\logs\controlnet-aux-cpu-evidence.txt'

function Invoke-Worker([string]$WorkerAction) {
  if (-not (Test-Path -LiteralPath $manager)) { throw "Worker manager is missing: $manager" }
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $manager -Action $WorkerAction
}

function Test-Api {
  $deadline = (Get-Date).AddSeconds(90)
  do {
    try { return Invoke-RestMethod -Uri 'http://127.0.0.1:8188/object_info' -TimeoutSec 10 }
    catch { Start-Sleep -Seconds 3 }
  } while ((Get-Date) -lt $deadline)
  throw 'ComfyUI did not return /object_info within 90 seconds.'
}

function Write-CurrentStatus {
  $nodes = $null
  try { $nodes = Invoke-RestMethod -Uri 'http://127.0.0.1:8188/object_info' -TimeoutSec 10 } catch {}
  [pscustomobject]@{
    Enabled = Test-Path -LiteralPath $enabled
    DisabledCheckout = Test-Path -LiteralPath $disabled
    ApiHealthy = $null -ne $nodes
    DWPreprocessor = $null -ne $nodes.DWPreprocessor
    OpenposePreprocessor = $null -ne $nodes.OpenposePreprocessor
    Evidence = $evidence
  } | Format-List
}

if ($Action -eq 'Status') { Write-CurrentStatus; exit 0 }

if ($Action -eq 'Disable') {
  Invoke-Worker 'Stop'
  if ((Test-Path -LiteralPath $enabled) -and -not (Test-Path -LiteralPath $disabled)) {
    Move-Item -LiteralPath $enabled -Destination $disabled
  }
  Invoke-Worker 'Start'
  Test-Api | Out-Null
  Write-CurrentStatus
  exit 0
}

if (-not (Test-Path -LiteralPath $python)) { throw "ComfyUI Python is missing: $python" }
if (-not (Test-Path -LiteralPath $disabled) -and -not (Test-Path -LiteralPath $enabled)) { throw 'ControlNet Auxiliary checkout is missing.' }

# Versions are locked from the successful 2026-09-20 resolver dry run. The
# CUDA-oriented onnxruntime-gpu package is intentionally excluded. The worker
# retains its existing onnxruntime 1.30 CPU provider for pose extraction.
$packages = @(
  'absl-py==2.5.0', 'addict==2.4.0', 'albucore==0.0.24', 'albumentations==2.0.8',
  'cloudpickle==3.1.2', 'colorlog==6.12.0', 'embreex==4.4.0', 'ftfy==6.3.1',
  'fvcore==0.1.5.post20221221', 'importlib_metadata==9.0.1', 'iopath==0.1.10',
  'joblib==1.6.0', 'lxml==6.1.3', 'manifold3d==3.5.3', 'mapbox_earcut==2.1.0',
  'narwhals==2.26.0', 'omegaconf==2.3.0', 'opencv-contrib-python==5.0.0.93',
  'platformdirs==4.11.11', 'pycollada==0.9.3',
  'rtree==1.4.1', 'scikit-learn==1.9.1', 'shapely==2.1.2', 'simsimd==6.5.16',
  'sounddevice==0.5.6', 'stringzilla==5.1.2', 'svg.path==7.1', 'tabulate==0.10.0',
  'termcolor==3.3.0', 'threadpoolctl==3.7.0', 'trimesh==5.1.0', 'vhacdx==0.1.0',
  'wcwidth==0.8.4', 'xxhash==4.0.1', 'yacs==0.1.8', 'yapf==0.43.0', 'zipp==4.1.0'
)

Invoke-Worker 'Stop'
try {
  & $python -m pip install @packages
  if ($LASTEXITCODE -ne 0) { throw 'Pinned ControlNet Auxiliary dependency installation failed.' }
  & $python -m pip check
  if ($LASTEXITCODE -ne 0) { throw 'Python dependency validation failed.' }
  # Install MediaPipe without a second resolver pass. Its exact OpenCV-contrib
  # dependency is already pinned and installed above while the worker is down.
  & $python -m pip install --no-deps 'mediapipe==1.0.1'
  if ($LASTEXITCODE -ne 0) { throw 'Pinned MediaPipe installation failed.' }
  & $python -c 'import cv2, mediapipe; print(cv2.__version__); print(mediapipe.__version__)'
  if ($LASTEXITCODE -ne 0) { throw 'OpenCV/MediaPipe import validation failed.' }
  $providers = & $python -c 'import onnxruntime as ort; print(ort.get_available_providers())'
  if ($LASTEXITCODE -ne 0 -or $providers -notmatch 'CPUExecutionProvider') { throw 'ONNX CPU provider is unavailable.' }
  if ((Test-Path -LiteralPath $disabled) -and -not (Test-Path -LiteralPath $enabled)) {
    Move-Item -LiteralPath $disabled -Destination $enabled
  }
  Invoke-Worker 'Start'
  $nodes = Test-Api
  if ($null -eq $nodes.DWPreprocessor -and $null -eq $nodes.OpenposePreprocessor) { throw 'Pose preprocessor nodes did not register.' }
  @(
    "EnabledUtc=$([DateTime]::UtcNow.ToString('o'))"
    "OnnxProviders=$providers"
    "DWPreprocessor=$($null -ne $nodes.DWPreprocessor)"
    "OpenposePreprocessor=$($null -ne $nodes.OpenposePreprocessor)"
    'Rollback=Run this script with -Action Disable'
  ) | Set-Content -LiteralPath $evidence -Encoding utf8
  Write-CurrentStatus
} catch {
  if ((Test-Path -LiteralPath $enabled) -and -not (Test-Path -LiteralPath $disabled)) {
    Move-Item -LiteralPath $enabled -Destination $disabled
  }
  Invoke-Worker 'Start'
  throw
}
