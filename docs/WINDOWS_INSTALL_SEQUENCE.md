# Windows Installation and Readiness Sequence

Run these commands in **Windows PowerShell as Administrator**. Complete one numbered step at a time. Stop when a gate reports `HOLD`; the JSON report identifies the failed check.

## 1. Download the maintained scripts

```powershell
$base = 'http://192.168.4.42:8765'
$downloads = "$env:USERPROFILE\Downloads"
Invoke-WebRequest "$base/setup-master-chief-ssh.ps1" -OutFile "$downloads\setup-master-chief-ssh.ps1"
Invoke-WebRequest "$base/manage-comfyui-worker.ps1" -OutFile "$downloads\manage-comfyui-worker.ps1"
Invoke-WebRequest "$base/test-master-chief-windows-readiness.ps1" -OutFile "$downloads\test-master-chief-windows-readiness.ps1"
Invoke-WebRequest "$base/install-juggernaut-xl-v9.ps1" -OutFile "$downloads\install-juggernaut-xl-v9.ps1"
```

## 2. Gate G0 — hardware and prerequisite preflight

```powershell
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\test-master-chief-windows-readiness.ps1" -Gate Preflight
```

Expected: `Gate outcome: PASS`. Evidence is written under `%USERPROFILE%\MasterChief\reports`.

## 3. Install restricted remote maintenance

```powershell
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\setup-master-chief-ssh.ps1"
Get-Service sshd | Format-List Status,StartType
```

Expected: `Running` and `Automatic`. The firewall rule accepts port 22 only from the Mac controller address.

## 4. Install the boot-time ComfyUI worker

```powershell
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\manage-comfyui-worker.ps1" -Action Install
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\manage-comfyui-worker.ps1" -Action Status
```

Expected: the scheduled task exists and the API becomes healthy. It starts about 30 seconds after Windows boot without an open PowerShell window.

## 5. Gate G1 — core worker

```powershell
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\test-master-chief-windows-readiness.ps1" -Gate Core
Invoke-RestMethod http://127.0.0.1:8188/system_stats | ConvertTo-Json -Depth 5
```

## 6. Install the approved image-quality checkpoint if it is not already present

```powershell
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\install-juggernaut-xl-v9.ps1"
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\manage-comfyui-worker.ps1" -Action Restart
```

The installer verifies the maintained SHA-256 before promotion.

## 7. Gate G2 — current image capability

```powershell
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\test-master-chief-windows-readiness.ps1" -Gate Image
Invoke-RestMethod http://127.0.0.1:8188/models/checkpoints | ConvertTo-Json -Depth 3
```

## 8. Video and cluster gates — assessment only

```powershell
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\test-master-chief-windows-readiness.ps1" -Gate VideoPilot
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\test-master-chief-windows-readiness.ps1" -Gate ClusterPilot
```

These gates intentionally return `HOLD` until an AMD-compatible workflow, model license/checksum, capacity measurement, rollback, and Apple-node inventory are approved. Do not install Mochi, MiniMax H3, or an unverified CUDA workflow to clear the gate.

## 9. Final status bundle

```powershell
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\test-master-chief-windows-readiness.ps1" -Gate All
Get-ChildItem "$env:USERPROFILE\MasterChief\reports"
Get-Content "$env:USERPROFILE\MasterChief\logs\comfyui-worker-error.log" -Tail 100 -ErrorAction SilentlyContinue
```

Closing PowerShell after these commands does not stop SSH or the boot-time ComfyUI task.

