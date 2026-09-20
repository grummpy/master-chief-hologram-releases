param(
  [string]$InstallRoot = "$env:USERPROFILE\MasterChief"
)

$ErrorActionPreference = 'Stop'
$root = Join-Path $InstallRoot 'ComfyUI'
$downloads = Join-Path $env:USERPROFILE 'Downloads'
$controlDir = Join-Path $root 'models\controlnet'
$vaeDir = Join-Path $root 'models\vae'
$manifestDir = Join-Path $InstallRoot 'model-manifests'
New-Item -ItemType Directory -Force -Path $controlDir, $vaeDir, $manifestDir | Out-Null

$health = Invoke-RestMethod 'http://127.0.0.1:8188/system_stats' -TimeoutSec 10
$queue = Invoke-RestMethod 'http://127.0.0.1:8188/queue' -TimeoutSec 10
if (@($queue.queue_running).Count -gt 0 -or @($queue.queue_pending).Count -gt 0) {
  throw 'ComfyUI queue is not idle.'
}

$drive = Get-PSDrive -Name C
if ($drive.Free -lt 8000000000) {
  throw "Insufficient disk reserve: $($drive.Free) bytes free."
}

$models = @(
  [PSCustomObject]@{
    Name = 'OpenPoseXL2.safetensors'
    Source = Join-Path $downloads 'OpenPoseXL2.safetensors'
    Destination = Join-Path $controlDir 'OpenPoseXL2.safetensors'
    SHA256 = '5A4B928CB1E93748217900CB66D4135BF70D932D2924232F925910FAD9E43A92'
    SourceUrl = 'https://huggingface.co/thibaud/controlnet-openpose-sdxl-1.0'
    License = 'other (publisher-declared)'
    Status = 'EXPERIMENT'
  },
  [PSCustomObject]@{
    Name = 'control-lora-openposeXL2-rank256.safetensors'
    Source = Join-Path $downloads 'control-lora-openposeXL2-rank256.safetensors'
    Destination = Join-Path $controlDir 'control-lora-openposeXL2-rank256.safetensors'
    SHA256 = '8AFA079285BF9384EAF8F6322884CB4F24BBE405DA490F91F5540D3BFF585E75'
    SourceUrl = 'https://huggingface.co/thibaud/controlnet-openpose-sdxl-1.0'
    License = 'other (publisher-declared)'
    Status = 'EXPERIMENT'
  },
  [PSCustomObject]@{
    Name = 'sdxl_vae.safetensors'
    Source = Join-Path $downloads 'sdxl_vae.safetensors'
    Destination = Join-Path $vaeDir 'sdxl_vae.safetensors'
    SHA256 = '63AEECB90FF7BC1C115395962D3E803571385B61938377BC7089B36E81E92E2E'
    SourceUrl = 'https://huggingface.co/stabilityai/sdxl-vae'
    License = 'MIT'
    Status = 'ADOPT'
  }
)

$results = foreach ($model in $models) {
  if (-not (Test-Path -LiteralPath $model.Source)) {
    throw "Missing source: $($model.Source)"
  }

  $sourceHash = (Get-FileHash -LiteralPath $model.Source -Algorithm SHA256).Hash
  if ($sourceHash -ne $model.SHA256) {
    throw "Checksum mismatch for $($model.Name): $sourceHash"
  }

  $action = 'COPIED'
  if (Test-Path -LiteralPath $model.Destination) {
    $destinationHash = (Get-FileHash -LiteralPath $model.Destination -Algorithm SHA256).Hash
    if ($destinationHash -ne $sourceHash) {
      throw "Destination exists with a different checksum: $($model.Destination)"
    }
    $action = 'ALREADY_PRESENT'
  } else {
    Copy-Item -LiteralPath $model.Source -Destination $model.Destination
  }

  $installedHash = (Get-FileHash -LiteralPath $model.Destination -Algorithm SHA256).Hash
  [PSCustomObject]@{
    Name = $model.Name
    Action = $action
    Destination = $model.Destination
    SHA256 = $installedHash
    License = $model.License
    Status = $model.Status
    SourceUrl = $model.SourceUrl
  }
}

$manifest = [PSCustomObject]@{
  installedAt = (Get-Date).ToString('o')
  host = $env:COMPUTERNAME
  comfyUiRoot = $root
  device = $health.devices[0].name
  freeDiskBytesAfter = (Get-PSDrive -Name C).Free
  rollback = 'Delete only the named destination files, then restart the Master Chief ComfyUI Worker task.'
  models = $results
}
$manifestPath = Join-Path $manifestDir ('sdxl-controlnet-vae-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')
$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

$results | Format-Table Name, Action, Status, License -AutoSize
Write-Output "MANIFEST=$manifestPath"
Write-Output "FREE_DISK=$((Get-PSDrive -Name C).Free)"
