param([string]$InstallRoot = "$env:USERPROFILE\MasterChief")
$ErrorActionPreference = 'Stop'
$destination = Join-Path $InstallRoot 'ComfyUI\models\checkpoints\sd_xl_base_1.0.safetensors'
$source = 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors?download=true'
$expectedHash = '31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b'
New-Item -ItemType Directory -Force -Path (Split-Path $destination) | Out-Null
if (Test-Path $destination) {
  $existing = (Get-FileHash -Algorithm SHA256 $destination).Hash.ToLowerInvariant()
  if ($existing -eq $expectedHash) { Write-Host 'Verified SDXL model is already installed.'; exit 0 }
  $backup = "$destination.invalid-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
  Move-Item $destination $backup
  Write-Warning "Existing unverified file preserved at $backup"
}
Write-Host 'Downloading SDXL 1.0 base (approximately 6.94 GB).'
Start-BitsTransfer -Source $source -Destination $destination -DisplayName 'Master Chief SDXL model'
$actualHash = (Get-FileHash -Algorithm SHA256 $destination).Hash.ToLowerInvariant()
if ($actualHash -ne $expectedHash) {
  $invalid = "$destination.invalid-$actualHash"
  Move-Item $destination $invalid
  throw "SDXL checksum mismatch. Unverified download preserved at $invalid"
}
Write-Host "SDXL installed and SHA-256 verified: $destination"
