# Windows Remote Operator and Upgrade Runbook

Version 2.0 — 2026-09-19

Windows worker: `192.168.4.31`

Mac controller: `192.168.4.42`

Windows account observed during setup: `decke`

This is the standing, ordered command document for the Windows AI worker. Run one numbered section at a time. Commands labeled **Windows** run in Windows PowerShell. Commands labeled **Mac** run in Terminal on the Mac. Stop on any red error or `HOLD`; do not skip forward.

## 1. Establish the remote channel first — Windows, one time

Open **PowerShell as Administrator** on Windows. The Mac script server must be running at `http://192.168.4.42:8765` for the download.

```powershell
$base = 'http://192.168.4.42:8765'
$downloads = "$env:USERPROFILE\Downloads"
Invoke-WebRequest "$base/setup-master-chief-ssh.ps1" -OutFile "$downloads\setup-master-chief-ssh.ps1"
PowerShell -ExecutionPolicy Bypass -File "$downloads\setup-master-chief-ssh.ps1"
```

The maintained script installs OpenSSH Server, registers the Mac public key, starts `sshd`, makes it automatic at boot, and restricts inbound port 22 to `192.168.4.42`.

Verify it before leaving Windows:

```powershell
Get-Service sshd | Format-List Status,StartType
Get-NetTCPConnection -LocalPort 22 -State Listen
Get-NetFirewallRule -DisplayName 'Master Chief SSH from Mac' |
  Get-NetFirewallAddressFilter |
  Format-List RemoteAddress
$env:USERNAME
ipconfig
```

Required evidence:

- `sshd` is `Running` and `Automatic`.
- TCP port 22 is listening.
- `RemoteAddress` is `192.168.4.42`.
- The active Windows address is still `192.168.4.31`.

## 2. Prove passwordless control — Mac

Run on the Mac:

```bash
nc -G 3 -vz 192.168.4.31 22
ssh -i /Users/daddy/.ssh/master-chief-windows_ed25519 \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  -o StrictHostKeyChecking=accept-new \
  decke@192.168.4.31 hostname
```

The first command must report port 22 open. The second must return the Windows computer name without requesting a password. Once this passes, the PowerShell window may be closed; SSH continues as a Windows service and returns automatically after reboot.

## 3. Download the maintained operator scripts — Windows

```powershell
$base = 'http://192.168.4.42:8765'
$downloads = "$env:USERPROFILE\Downloads"
Invoke-WebRequest "$base/manage-comfyui-worker.ps1" -OutFile "$downloads\manage-comfyui-worker.ps1"
Invoke-WebRequest "$base/test-master-chief-windows-readiness.ps1" -OutFile "$downloads\test-master-chief-windows-readiness.ps1"
Invoke-WebRequest "$base/install-juggernaut-xl-v9.ps1" -OutFile "$downloads\install-juggernaut-xl-v9.ps1"
```

## 4. Gate G0 — hardware and prerequisites

```powershell
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\test-master-chief-windows-readiness.ps1" -Gate Preflight
```

Required: `Gate outcome: PASS`. Reports are stored under `%USERPROFILE%\MasterChief\reports`.

## 5. Install the background ComfyUI worker

```powershell
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\manage-comfyui-worker.ps1" -Action Install
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\manage-comfyui-worker.ps1" -Action Status
```

The scheduled task starts about 30 seconds after Windows boots, runs without an open PowerShell window, and writes logs under `%USERPROFILE%\MasterChief\logs`.

## 6. Gate G1 — worker health

```powershell
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\test-master-chief-windows-readiness.ps1" -Gate Core
Invoke-RestMethod http://127.0.0.1:8188/system_stats | ConvertTo-Json -Depth 5
```

Required: the API is healthy and reports the AMD Radeon RX 9060 XT worker.

## 7. Install and verify the stronger SDXL checkpoint

This is a large download. Let it complete; do not close the transfer window while it is downloading.

```powershell
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\install-juggernaut-xl-v9.ps1"
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\manage-comfyui-worker.ps1" -Action Restart
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\test-master-chief-windows-readiness.ps1" -Gate Image
Invoke-RestMethod http://127.0.0.1:8188/models/checkpoints | ConvertTo-Json -Depth 3
```

Required: the installer checksum passes, the API returns healthy, and the checkpoint list includes Juggernaut XL. A downloaded model is not promoted until a real image completes and is returned to the app.

## 8. Remote maintenance commands — Mac

Use this prefix for an interactive Windows session:

```bash
ssh -i /Users/daddy/.ssh/master-chief-windows_ed25519 decke@192.168.4.31
```

Check worker status remotely:

```bash
ssh -i /Users/daddy/.ssh/master-chief-windows_ed25519 decke@192.168.4.31 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\manage-comfyui-worker.ps1" -Action Status'
```

Restart the worker remotely:

```bash
ssh -i /Users/daddy/.ssh/master-chief-windows_ed25519 decke@192.168.4.31 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\manage-comfyui-worker.ps1" -Action Restart'
```

Read the latest error log remotely:

```bash
ssh -i /Users/daddy/.ssh/master-chief-windows_ed25519 decke@192.168.4.31 'powershell.exe -NoProfile -Command "Get-Content \"$env:USERPROFILE\MasterChief\logs\comfyui-worker-error.log\" -Tail 120 -ErrorAction SilentlyContinue"'
```

Run the full readiness report remotely:

```bash
ssh -i /Users/daddy/.ssh/master-chief-windows_ed25519 decke@192.168.4.31 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\test-master-chief-windows-readiness.ps1" -Gate All'
```

## 9. Gaming handoff — keep SSH, release the GPU

SSH uses negligible GPU resources. Stop only the ComfyUI worker before gaming; the remote maintenance channel remains available.

From the Mac:

```bash
ssh -i /Users/daddy/.ssh/master-chief-windows_ed25519 decke@192.168.4.31 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\manage-comfyui-worker.ps1" -Action Stop'
```

After gaming, restore the AI worker:

```bash
ssh -i /Users/daddy/.ssh/master-chief-windows_ed25519 decke@192.168.4.31 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\manage-comfyui-worker.ps1" -Action Start'
```

Confirm health:

```bash
curl --connect-timeout 5 http://192.168.4.31:8188/system_stats
```

If Windows reboots, SSH and the ComfyUI scheduled task both return automatically. To game immediately after a reboot, run the stop command after Windows finishes starting.

## 10. Recovery if SSH does not connect

On Windows, in **PowerShell as Administrator**:

```powershell
Get-Service sshd | Format-List Status,StartType
Start-Service sshd
Set-Service sshd -StartupType Automatic
Get-NetTCPConnection -LocalPort 22 -State Listen
Get-Content "$env:ProgramData\ssh\administrators_authorized_keys"
Get-NetFirewallRule -DisplayName 'Master Chief SSH from Mac' |
  Format-List Enabled,Direction,Action,Profile
Get-NetFirewallRule -DisplayName 'Master Chief SSH from Mac' |
  Get-NetFirewallAddressFilter |
  Format-List RemoteAddress
```

On the Mac, confirm its Wi-Fi address:

```bash
ipconfig getifaddr en0
```

If the Mac address is no longer `192.168.4.42`, rerun `setup-master-chief-ssh.ps1` only after its `$controllerIp` is updated to the new address. Do not broaden the firewall rule to the whole LAN as a shortcut.

## 11. Final evidence bundle

```powershell
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\test-master-chief-windows-readiness.ps1" -Gate All
Get-ChildItem "$env:USERPROFILE\MasterChief\reports"
Get-Content "$env:USERPROFILE\MasterChief\logs\comfyui-worker-error.log" -Tail 100 -ErrorAction SilentlyContinue
```

Video and cluster checks may correctly remain `HOLD` until an AMD-compatible workflow, model license/checksum, capacity measurement, real output, and rollback procedure are proven. A `HOLD` is not permission to install an unverified CUDA workflow.
