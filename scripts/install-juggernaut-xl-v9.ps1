param([string]$InstallRoot = "$env:USERPROFILE\MasterChief")
$ErrorActionPreference = 'Stop'
$destination = Join-Path $InstallRoot 'ComfyUI\models\checkpoints\Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors'
$url = 'https://huggingface.co/RunDiffusion/Juggernaut-XL-v9/resolve/main/Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors?download=true'
$expected = 'c9e3e68f89b8e38689e1097d4be4573cf308de4e3fd044c64ca697bdb4aa8bca'
New-Item -ItemType Directory -Force -Path (Split-Path $destination) | Out-Null
if ((Test-Path $destination) -and (Get-FileHash $destination -Algorithm SHA256).Hash.ToLower() -eq $expected) { Write-Host 'Juggernaut XL v9 is already installed and verified.'; exit 0 }
$partial = "$destination.download"
Write-Host 'Downloading official Juggernaut XL v9 (7.11 GB). Keep this window open.'
Start-BitsTransfer -Source $url -Destination $partial -DisplayName 'Master Chief Juggernaut XL v9'
$actual = (Get-FileHash $partial -Algorithm SHA256).Hash.ToLower()
if ($actual -ne $expected) { throw "Checksum mismatch. Expected $expected but received $actual." }
Move-Item -Force $partial $destination
Write-Host 'Juggernaut XL v9 installed and SHA-256 verified.'
