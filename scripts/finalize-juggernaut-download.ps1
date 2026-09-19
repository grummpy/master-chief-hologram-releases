$ErrorActionPreference = 'Stop'
$displayName = 'Master Chief Juggernaut XL v9'
$partial = "$env:USERPROFILE\MasterChief\ComfyUI\models\checkpoints\Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors.download"
$destination = "$env:USERPROFILE\MasterChief\ComfyUI\models\checkpoints\Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors"
$expected = 'c9e3e68f89b8e38689e1097d4be4573cf308de4e3fd044c64ca697bdb4aa8bca'
$job = Get-BitsTransfer -AllUsers | Where-Object DisplayName -eq $displayName | Select-Object -First 1
if (-not $job) { exit 0 }
if ($job.JobState -in @('TransientError', 'Error', 'Suspended')) { Resume-BitsTransfer -BitsJob $job -Asynchronous; exit 0 }
if ($job.JobState -ne 'Transferred') { exit 0 }
Complete-BitsTransfer -BitsJob $job
$actual = (Get-FileHash $partial -Algorithm SHA256).Hash.ToLower()
if ($actual -ne $expected) { throw "Juggernaut checksum mismatch. Expected $expected but received $actual." }
Move-Item -LiteralPath $partial -Destination $destination -Force
schtasks.exe /Run /TN 'Master Chief ComfyUI Worker' | Out-Null
Write-Host "Juggernaut XL v9 installed and verified: $actual"
