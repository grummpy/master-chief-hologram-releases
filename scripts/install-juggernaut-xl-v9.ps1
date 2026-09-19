param([string]$InstallRoot = "$env:USERPROFILE\MasterChief")
$ErrorActionPreference = 'Stop'
$destination = Join-Path $InstallRoot 'ComfyUI\models\checkpoints\Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors'
$url = 'https://huggingface.co/RunDiffusion/Juggernaut-XL-v9/resolve/main/Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors?download=true'
$expected = 'c9e3e68f89b8e38689e1097d4be4573cf308de4e3fd044c64ca697bdb4aa8bca'
New-Item -ItemType Directory -Force -Path (Split-Path $destination) | Out-Null
if ((Test-Path $destination) -and (Get-FileHash $destination -Algorithm SHA256).Hash.ToLower() -eq $expected) { Write-Host 'Juggernaut XL v9 is already installed and verified.'; exit 0 }
$partial = "$destination.download"
$finalizer = Join-Path $env:USERPROFILE 'Downloads\finalize-juggernaut-download.ps1'
if (-not (Test-Path $finalizer)) { throw "Finalizer was not found at $finalizer" }
Get-BitsTransfer -AllUsers | Where-Object DisplayName -eq 'Master Chief Juggernaut XL v9' | Remove-BitsTransfer -Confirm:$false -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $partial -Force -ErrorAction SilentlyContinue
$job = Start-BitsTransfer -Source $url -Destination $partial -DisplayName 'Master Chief Juggernaut XL v9' -Description "Official checkpoint SHA256 $expected" -Asynchronous -TransferPolicy Always -RetryInterval 60 -RetryTimeout 1209600
schtasks.exe /Create /TN 'Master Chief Juggernaut Finalizer' /SC MINUTE /MO 5 /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File $finalizer" /F | Out-Null
Write-Host "Juggernaut download started in the background: $($job.JobId)"
Write-Host 'The finalizer resumes errors, verifies SHA-256, installs the model, and restarts ComfyUI automatically.'
